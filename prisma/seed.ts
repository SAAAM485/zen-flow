import {
    PrismaClient,
    FollowRequestStatus,
    ReactionType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding...");

    // 創建使用者
    const users = [];
    for (let i = 0; i < 10; i++) {
        const user = await prisma.user.upsert({
            where: { email: faker.internet.email() }, // 使用 email 作為唯一識別符
            update: {},
            create: {
                name: faker.person.fullName(),
                email: faker.internet.email(),
                image: faker.image.avatar(),
                password: faker.internet.password(), // 僅為測試目的，實際應用中不應這樣處理密碼
            },
        });
        users.push(user);
    }
    console.log(`Created ${users.length} users.`);

    // 創建貼文
    const posts = [];
    for (const user of users) {
        for (let i = 0; i < faker.number.int({ min: 1, max: 5 }); i++) {
            const post = await prisma.post.create({
                data: {
                    authorId: user.id,
                    text: faker.lorem.paragraph(),
                    imageUrls: Array.from(
                        { length: faker.number.int({ min: 0, max: 3 }) },
                        () => faker.image.urlPicsumPhotos()
                    ), // 隨機加入 0-3 張圖片
                },
            });
            posts.push(post);
        }
    }
    console.log(`Created ${posts.length} posts.`);

    // 創建留言
    const comments = [];
    for (const post of posts) {
        for (let i = 0; i < faker.number.int({ min: 0, max: 10 }); i++) {
            const randomUser = faker.helpers.arrayElement(users);
            const comment = await prisma.comment.create({
                data: {
                    postId: post.id,
                    authorId: randomUser.id,
                    text: faker.lorem.sentence(),
                    isHighlighted: faker.datatype.boolean(),
                },
            });
            comments.push(comment);
        }
    }
    console.log(`Created ${comments.length} comments.`);

    // 創建貼文按讚
    const postLikes = [];
    for (const post of posts) {
        const likedUsers = faker.helpers.arrayElements(users, {
            min: 0,
            max: users.length / 2,
        });
        for (const user of likedUsers) {
            try {
                const postLike = await prisma.postLike.create({
                    data: {
                        userId: user.id,
                        postId: post.id,
                        type: faker.helpers.arrayElement(
                            Object.values(ReactionType)
                        ),
                    },
                });
                postLikes.push(postLike);
            } catch (e: unknown) {
                // 處理唯一約束衝突，如果同一個用戶對同一個貼文按讚多次
                if (e instanceof Error && "code" in e && e.code === "P2002") {
                    // console.log('Duplicate post like, skipping.');
                } else {
                    throw e;
                }
            }
        }
    }
    console.log(`Created ${postLikes.length} post likes.`);

    // 創建留言按讚
    const commentLikes = [];
    for (const comment of comments) {
        const likedUsers = faker.helpers.arrayElements(users, {
            min: 0,
            max: users.length / 2,
        });
        for (const user of likedUsers) {
            try {
                const commentLike = await prisma.commentLike.create({
                    data: {
                        userId: user.id,
                        commentId: comment.id,
                        type: faker.helpers.arrayElement(
                            Object.values(ReactionType)
                        ),
                    },
                });
                commentLikes.push(commentLike);
            } catch (e: unknown) {
                // 處理唯一約束衝突
                if (e instanceof Error && "code" in e && e.code === "P2002") {
                    // console.log('Duplicate comment like, skipping.');
                } else {
                    throw e;
                }
            }
        }
    }
    console.log(`Created ${commentLikes.length} comment likes.`);

    // 創建追蹤請求和追蹤關係
    for (let i = 0; i < users.length * 2; i++) {
        const fromUser = faker.helpers.arrayElement(users);
        const toUser = faker.helpers.arrayElement(users);

        if (fromUser.id === toUser.id) continue; // 不能自己追蹤自己

        const status = faker.helpers.arrayElement(
            Object.values(FollowRequestStatus)
        );

        try {
            if (status === FollowRequestStatus.ACCEPTED) {
                // 如果請求被接受，則創建追蹤關係
                await prisma.follow.create({
                    data: {
                        followerId: fromUser.id,
                        followingId: toUser.id,
                    },
                });
            }
        } catch (e: unknown) {
            // 處理唯一約束衝突
            if (e instanceof Error && "code" in e && e.code === "P2002") {
                // console.log('Duplicate follow request/follow, skipping.');
            } else {
                throw e;
            }
        }
    }
    console.log("Created follow requests and relationships.");

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
