-- CreateTable
CREATE TABLE "game_sessions" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_results" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 5,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_progress" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "gamesCompleted" INTEGER NOT NULL DEFAULT 0,
    "goalReached" BOOLEAN NOT NULL DEFAULT false,
    "quizDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_results_date_key" ON "quiz_results"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_progress_date_key" ON "daily_progress"("date");
