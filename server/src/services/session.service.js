import prisma from '../prisma/index.js';

// Helper: Serialize BigInt
const serialize = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
));

// 1. Create Session
export async function createSession(teacherId, data) {
    const session = await prisma.session.create({
        data: {
            title: data.title,
            teacherId: BigInt(teacherId),
            categoryId: BigInt(data.categoryId),
            status: 'waiting'
        },
        include: { category: true }
    });
    return serialize(session);
}

// 2. Get All Sessions
export async function getAllSessions() {
    const sessions = await prisma.session.findMany({
        include: { 
            teacher: { select: { name: true } },
            category: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    return serialize(sessions);
}

// 3. Get Detail Session (PERBAIKAN DISINI: Tambah role: true)
export async function getSessionDetail(sessionId) {
    const session = await prisma.session.findUnique({
        where: { id: BigInt(sessionId) },
        include: {
            participants: {
                include: { 
                    user: { 
                        select: { 
                            id: true, 
                            name: true, 
                            role: true // <--- WAJIB ADA agar frontend bisa filter student
                        } 
                    } 
                }
            },
            teacher: { select: { id: true, name: true } },
            category: { select: { name: true } } // Tambahkan info kategori juga biar lengkap
        }
    });
    return serialize(session);
}

// 4. Join Session (Socket)
export async function joinSession(sessionId, userId) {
    try {
        console.log(`[DB] Upserting Participant: Sess=${sessionId}, User=${userId}`);
        
        await prisma.sessionParticipant.upsert({
            where: {
                sessionId_userId: {
                    sessionId: BigInt(sessionId),
                    userId: BigInt(userId)
                }
            },
            update: {
                is_present: true,
                joined_at: new Date()
            },
            create: {
                sessionId: BigInt(sessionId),
                userId: BigInt(userId),
                is_present: true
            }
        });

        return getSessionDetail(sessionId);
    } catch (error) {
        console.error("Error joining session:", error);
        throw error;
    }
}

// 5. Leave Session
export async function leaveSession(sessionId, userId) {
    try {
        await prisma.sessionParticipant.update({
            where: {
                sessionId_userId: {
                    sessionId: BigInt(sessionId),
                    userId: BigInt(userId)
                }
            },
            data: { is_present: false }
        });
        
        return getSessionDetail(sessionId);
    } catch (error) {
        return null;
    }
}

// 6. Start Game
export async function startGame(sessionId) {
    const session = await prisma.session.update({
        where: { id: BigInt(sessionId) },
        data: { 
            status: 'running',
            startedAt: new Date()
        }
    });
    return serialize(session);
}

// 7. Record Turn
export async function recordTurn({ sessionId, participantId, cardId, type, answer, score, feedback }) {
    const turn = await prisma.sessionTurn.create({
        data: {
            sessionId: BigInt(sessionId),
            participantId: BigInt(participantId),
            cardId: BigInt(cardId),
            answer_text: answer,
            score: parseInt(score),
            feedback: feedback,
            answered_at: new Date(),
            graded_at: new Date()
        }
    });
    return serialize(turn);
}

// 8. Get Random Card
export async function getRandomCard(categoryId, type) {
    const cards = await prisma.card.findMany({
        where: { 
            categoryId: BigInt(categoryId),
            type: type 
        }
    });

    if (cards.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return serialize(cards[randomIndex]);
}

// 9. End Game
export async function endGame(sessionId) {
    await prisma.session.update({
        where: { id: BigInt(sessionId) },
        data: { 
            status: 'finished',
            endedAt: new Date()
        }
    });
}

// 10. Get History per User
export async function getUserHistory(userId, role) {
    const whereClause = {
        status: 'finished' // Hanya ambil yang sudah selesai
    };

    if (role === 'teacher') {
        whereClause.teacherId = BigInt(userId);
    } else {
        // Untuk siswa: Cari sesi dimana dia ada di daftar participants
        whereClause.participants = {
            some: { userId: BigInt(userId) }
        };
    }

    const sessions = await prisma.session.findMany({
        where: whereClause,
        include: {
            teacher: { select: { name: true } },
            category: { select: { name: true } },
            // Sertakan nilai siswa tersebut di sesi ini (opsional, untuk detail history)
            turns: {
                where: role === 'student' ? {
                    participant: { userId: BigInt(userId) }
                } : undefined
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return serialize(sessions);
}

// 11. Manual End/Delete Session (HTTP)
export async function archiveSession(sessionId) {
    const session = await prisma.session.update({
        where: { id: BigInt(sessionId) },
        data: { 
            status: 'finished',
            endedAt: new Date()
        }
    });
    return serialize(session);
}