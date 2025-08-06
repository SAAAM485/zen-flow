"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var faker_1 = require("@faker-js/faker");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var users, i, user, posts, _i, users_1, user, i, post, comments, _a, posts_1, post, i, randomUser, comment, postLikes, _b, posts_2, post, likedUsers, _c, likedUsers_1, user, postLike, e_1, commentLikes, _d, comments_1, comment, likedUsers, _e, likedUsers_2, user, commentLike, e_2, i, fromUser, toUser, status_1, followRequest, e_3;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('Start seeding...');
                    // 清空現有資料 (可選，開發時方便)
                    return [4 /*yield*/, prisma.commentLike.deleteMany()];
                case 1:
                    // 清空現有資料 (可選，開發時方便)
                    _f.sent();
                    return [4 /*yield*/, prisma.postLike.deleteMany()];
                case 2:
                    _f.sent();
                    return [4 /*yield*/, prisma.comment.deleteMany()];
                case 3:
                    _f.sent();
                    // await prisma.image.deleteMany(); // 暫時註解掉，因為 Image 模型已註解
                    return [4 /*yield*/, prisma.post.deleteMany()];
                case 4:
                    // await prisma.image.deleteMany(); // 暫時註解掉，因為 Image 模型已註解
                    _f.sent();
                    return [4 /*yield*/, prisma.follow.deleteMany()];
                case 5:
                    _f.sent();
                    return [4 /*yield*/, prisma.followRequest.deleteMany()];
                case 6:
                    _f.sent();
                    return [4 /*yield*/, prisma.oAuthAccount.deleteMany()];
                case 7:
                    _f.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 8:
                    _f.sent();
                    users = [];
                    i = 0;
                    _f.label = 9;
                case 9:
                    if (!(i < 10)) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: faker_1.faker.person.fullName(),
                                email: faker_1.faker.internet.email(),
                                image: faker_1.faker.image.avatar(),
                                guest: false,
                                password: faker_1.faker.internet.password(), // 僅為測試目的，實際應用中不應這樣處理密碼
                            },
                        })];
                case 10:
                    user = _f.sent();
                    users.push(user);
                    _f.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 9];
                case 12:
                    console.log("Created ".concat(users.length, " users."));
                    posts = [];
                    _i = 0, users_1 = users;
                    _f.label = 13;
                case 13:
                    if (!(_i < users_1.length)) return [3 /*break*/, 18];
                    user = users_1[_i];
                    i = 0;
                    _f.label = 14;
                case 14:
                    if (!(i < faker_1.faker.number.int({ min: 1, max: 5 }))) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.post.create({
                            data: {
                                authorId: user.id,
                                text: faker_1.faker.lorem.paragraph(),
                                imageUrl: faker_1.faker.helpers.arrayElement([faker_1.faker.image.urlPicsumPhotos(), null]), // 隨機加入圖片 URL 或為 null
                            },
                        })];
                case 15:
                    post = _f.sent();
                    posts.push(post);
                    _f.label = 16;
                case 16:
                    i++;
                    return [3 /*break*/, 14];
                case 17:
                    _i++;
                    return [3 /*break*/, 13];
                case 18:
                    console.log("Created ".concat(posts.length, " posts."));
                    comments = [];
                    _a = 0, posts_1 = posts;
                    _f.label = 19;
                case 19:
                    if (!(_a < posts_1.length)) return [3 /*break*/, 24];
                    post = posts_1[_a];
                    i = 0;
                    _f.label = 20;
                case 20:
                    if (!(i < faker_1.faker.number.int({ min: 0, max: 10 }))) return [3 /*break*/, 23];
                    randomUser = faker_1.faker.helpers.arrayElement(users);
                    return [4 /*yield*/, prisma.comment.create({
                            data: {
                                postId: post.id,
                                authorId: randomUser.id,
                                text: faker_1.faker.lorem.sentence(),
                                isHighlighted: faker_1.faker.datatype.boolean(),
                            },
                        })];
                case 21:
                    comment = _f.sent();
                    comments.push(comment);
                    _f.label = 22;
                case 22:
                    i++;
                    return [3 /*break*/, 20];
                case 23:
                    _a++;
                    return [3 /*break*/, 19];
                case 24:
                    console.log("Created ".concat(comments.length, " comments."));
                    postLikes = [];
                    _b = 0, posts_2 = posts;
                    _f.label = 25;
                case 25:
                    if (!(_b < posts_2.length)) return [3 /*break*/, 32];
                    post = posts_2[_b];
                    likedUsers = faker_1.faker.helpers.arrayElements(users, { min: 0, max: users.length / 2 });
                    _c = 0, likedUsers_1 = likedUsers;
                    _f.label = 26;
                case 26:
                    if (!(_c < likedUsers_1.length)) return [3 /*break*/, 31];
                    user = likedUsers_1[_c];
                    _f.label = 27;
                case 27:
                    _f.trys.push([27, 29, , 30]);
                    return [4 /*yield*/, prisma.postLike.create({
                            data: {
                                userId: user.id,
                                postId: post.id,
                                type: faker_1.faker.helpers.arrayElement(Object.values(client_1.ReactionType)),
                            },
                        })];
                case 28:
                    postLike = _f.sent();
                    postLikes.push(postLike);
                    return [3 /*break*/, 30];
                case 29:
                    e_1 = _f.sent();
                    // 處理唯一約束衝突，如果同一個用戶對同一個貼文按讚多次
                    if (e_1 instanceof Error && 'code' in e_1 && e_1.code === 'P2002') {
                        // console.log('Duplicate post like, skipping.');
                    }
                    else {
                        throw e_1;
                    }
                    return [3 /*break*/, 30];
                case 30:
                    _c++;
                    return [3 /*break*/, 26];
                case 31:
                    _b++;
                    return [3 /*break*/, 25];
                case 32:
                    console.log("Created ".concat(postLikes.length, " post likes."));
                    commentLikes = [];
                    _d = 0, comments_1 = comments;
                    _f.label = 33;
                case 33:
                    if (!(_d < comments_1.length)) return [3 /*break*/, 40];
                    comment = comments_1[_d];
                    likedUsers = faker_1.faker.helpers.arrayElements(users, { min: 0, max: users.length / 2 });
                    _e = 0, likedUsers_2 = likedUsers;
                    _f.label = 34;
                case 34:
                    if (!(_e < likedUsers_2.length)) return [3 /*break*/, 39];
                    user = likedUsers_2[_e];
                    _f.label = 35;
                case 35:
                    _f.trys.push([35, 37, , 38]);
                    return [4 /*yield*/, prisma.commentLike.create({
                            data: {
                                userId: user.id,
                                commentId: comment.id,
                                type: faker_1.faker.helpers.arrayElement(Object.values(client_1.ReactionType)),
                            },
                        })];
                case 36:
                    commentLike = _f.sent();
                    commentLikes.push(commentLike);
                    return [3 /*break*/, 38];
                case 37:
                    e_2 = _f.sent();
                    // 處理唯一約束衝突
                    if (e_2 instanceof Error && 'code' in e_2 && e_2.code === 'P2002') {
                        // console.log('Duplicate comment like, skipping.');
                    }
                    else {
                        throw e_2;
                    }
                    return [3 /*break*/, 38];
                case 38:
                    _e++;
                    return [3 /*break*/, 34];
                case 39:
                    _d++;
                    return [3 /*break*/, 33];
                case 40:
                    console.log("Created ".concat(commentLikes.length, " comment likes."));
                    i = 0;
                    _f.label = 41;
                case 41:
                    if (!(i < users.length * 2)) return [3 /*break*/, 48];
                    fromUser = faker_1.faker.helpers.arrayElement(users);
                    toUser = faker_1.faker.helpers.arrayElement(users);
                    if (fromUser.id === toUser.id)
                        return [3 /*break*/, 47]; // 不能自己追蹤自己
                    status_1 = faker_1.faker.helpers.arrayElement(Object.values(client_1.FollowRequestStatus));
                    _f.label = 42;
                case 42:
                    _f.trys.push([42, 46, , 47]);
                    return [4 /*yield*/, prisma.followRequest.create({
                            data: {
                                fromId: fromUser.id,
                                toId: toUser.id,
                                status: status_1,
                            },
                        })];
                case 43:
                    followRequest = _f.sent();
                    if (!(status_1 === client_1.FollowRequestStatus.ACCEPTED)) return [3 /*break*/, 45];
                    // 如果請求被接受，則創建追蹤關係
                    return [4 /*yield*/, prisma.follow.create({
                            data: {
                                followerId: fromUser.id,
                                followingId: toUser.id,
                            },
                        })];
                case 44:
                    // 如果請求被接受，則創建追蹤關係
                    _f.sent();
                    _f.label = 45;
                case 45: return [3 /*break*/, 47];
                case 46:
                    e_3 = _f.sent();
                    // 處理唯一約束衝突
                    if (e_3 instanceof Error && 'code' in e_3 && e_3.code === 'P2002') {
                        // console.log('Duplicate follow request/follow, skipping.');
                    }
                    else {
                        throw e_3;
                    }
                    return [3 /*break*/, 47];
                case 47:
                    i++;
                    return [3 /*break*/, 41];
                case 48:
                    console.log('Created follow requests and relationships.');
                    console.log('Seeding finished.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
