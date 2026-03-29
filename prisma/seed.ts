import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // --- Seed Admin ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      username: "admin",
      role: "ADMIN",
      authProvider: "LOCAL",
    },
  });

  // --- Seed 15 Users ---
  const usernames = [
    "stretford_end_fan", "tactics_guru", "the_referee", "goal_machine",
    "midfield_maestro", "parking_the_bus", "gegenpressing_99", "offside_flag",
    "var_hater_101", "golden_boot_dreamer", "clean_sheet_king", "pitch_side_viewers",
    "stoppage_time_hero", "transfer_window_junkie", "relegation_battler"
  ];

  const users = [];
  for (const username of usernames) {
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        email: `${username}@example.com`,
        passwordHash,
        authProvider: "LOCAL",
        role: "USER",
      },
    });
    users.push(user);
  }

  // --- Seed Banned Users ---
  const bannedUsers = [
    { username: "spam_bot_9000", reason: "Automated spam detected" },
    { username: "toxic_troll", reason: "Persistent harassment of other users" }
  ];

  for (const info of bannedUsers) {
    const user = await prisma.user.upsert({
      where: { username: info.username },
      update: { isBanned: true },
      create: {
        username: info.username,
        email: `${info.username}@example.com`,
        passwordHash,
        authProvider: "LOCAL",
        role: "USER",
        isBanned: true,
      },
    });

    // Seed Ban Appeal
    await prisma.banAppeal.upsert({
      where: { id: `appeal-${user.id}` },
      update: {},
      create: {
        id: `appeal-${user.id}`,
        userId: user.id,
        message: `I am sorry for being a ${info.username.includes("spam") ? "bot" : "troll"}. Please let me back in, I've learned my lesson!`,
        status: "PENDING",
      }
    });
  }

  // --- Seed Threads & Posts ---
  const threadsData = [
    {
      id: "thread-transfer",
      title: "Transfer Rumors Mega-Thread",
      content: "Which big players are moving clubs this summer? Post your rumors and links here!",
      authorId: users[4].id,
      posts: [
        { authorId: users[0].id, content: "Seeing a lot of talk about Mbappe to Real Madrid (finally)." },
        { authorId: users[13].id, content: "My local team is looking for a new keeper. Any suggestions?" },
        { authorId: users[2].id, content: "Stay focused on the current season, rumors are just rumors!" },
      ]
    },
    {
      id: "thread-tactics",
      title: "Is 'Tiki-Taka' officially dead?",
      content: "It seems like direct counter-attacking football is the meta now. What do you think?",
      authorId: users[1].id,
      posts: [
        { authorId: users[6].id, content: "Klopp's high-press style really took over for a while." },
        { authorId: users[5].id, content: "Don't underestimate the control from keeping the ball." },
        { authorId: users[1].id, content: "Yes, but you need the exact right players for it." },
      ]
    },
    {
      id: "thread-v-a-r",
      title: "VAR is ruining the flow of the game",
      content: "Discuss. Personally, I'm tired of waiting 3 minutes for an offside check.",
      authorId: users[8].id,
      posts: [
        { authorId: users[7].id, content: "The offside flag being held up is much more satisfying." },
        { authorId: admin.id, content: "We need technology to be accurate, but it should be faster." },
        { authorId: users[8].id, content: "Accuracy at what cost? The celebration is being killed." },
      ]
    },
    {
      id: "thread-matchday-1",
      title: "Matchday 1 Discussion",
      content: "Opening weekend is here! Predictions below.",
      authorId: admin.id,
      posts: [
        { authorId: users[3].id, content: "3-0 for the home team in the opener." },
        { authorId: users[10].id, content: "Clean sheet expected for the champions." },
        { authorId: users[12].id, content: "Always a surprise on day one!" },
      ]
    }
  ];

  for (const t of threadsData) {
    const thread = await prisma.thread.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        title: t.title,
        content: t.content,
        authorId: t.authorId,
      },
    });

    for (let i = 0; i < t.posts.length; i++) {
      const p = t.posts[i];
      await prisma.post.upsert({
        where: { id: `post-${t.id}-${i}` },
        update: {},
        create: {
          id: `post-${t.id}-${i}`,
          threadId: thread.id,
          authorId: p.authorId,
          content: p.content,
        },
      });
    }
  }

  // --- Seed 2 robust Polls with Votes ---
  const poll1 = await prisma.poll.create({
    data: {
      threadId: "thread-matchday-1",
      authorId: admin.id,
      question: "Who will win the Golden Boot?",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      options: {
        create: [
          { text: "Erling Haaland" },
          { text: "Mohamed Salah" },
          { text: "Ollie Watkins" },
          { text: "Someone Else" },
        ],
      },
    },
    include: { options: true }
  });

  // Distribute votes
  for (let i = 0; i < 8; i++) {
    await prisma.pollVote.upsert({
      where: { pollId_userId: { pollId: poll1.id, userId: users[i].id } },
      update: {},
      create: {
        pollId: poll1.id,
        userId: users[i].id,
        pollOptionId: poll1.options[i % 4].id
      }
    });
  }

  // --- Seed Reports ---
  await prisma.report.upsert({
    where: { id: "report-1" },
    update: {},
    create: {
      id: "report-1",
      reporterId: users[0].id,
      reason: "Offensive language in the transfer thread",
      threadId: "thread-transfer",
      status: "PENDING"
    }
  });

  await prisma.report.upsert({
    where: { id: "report-2" },
    update: {},
    create: {
      id: "report-2",
      reporterId: users[1].id,
      reason: "Spam behavior",
      postId: "post-thread-v-a-r-0",
      status: "PENDING"
    }
  });

  console.log("Seeding complete! Statistics:");
  console.log(`- Users: ${users.length + bannedUsers.length + 1}`);
  console.log(`- Threads: ${threadsData.length}`);
  console.log(`- Posts: ${threadsData.reduce((acc, t) => acc + t.posts.length, 0)}`);
  console.log(`- Polls: 1 (with votes)`);
  console.log(`- Reports: 2`);
  console.log(`- Appeals: ${bannedUsers.length}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
