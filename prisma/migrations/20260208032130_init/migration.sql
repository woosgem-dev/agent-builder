-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('PENDING', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('S', 'A', 'B', 'C', 'D');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "github_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'github',
    "source_owner" TEXT NOT NULL,
    "source_repo" TEXT NOT NULL,
    "source_path" TEXT NOT NULL,
    "source_ref" TEXT NOT NULL DEFAULT 'main',
    "min_model" TEXT,
    "base_tokens" INTEGER,
    "context_hint" TEXT,
    "icon" TEXT,
    "license" TEXT,
    "status" "SkillStatus" NOT NULL DEFAULT 'PENDING',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_tags" (
    "skill_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "skill_tags_pkey" PRIMARY KEY ("skill_id","tag_id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_tools" (
    "skill_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "skill_tools_pkey" PRIMARY KEY ("skill_id","tool_id")
);

-- CreateTable
CREATE TABLE "use_cases" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "use_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_roles" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "target_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_scores" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "core_field_score" INTEGER NOT NULL,
    "description_score" INTEGER NOT NULL,
    "runtime_score" INTEGER NOT NULL,
    "resources_score" INTEGER NOT NULL,
    "use_cases_score" INTEGER NOT NULL,
    "dependencies_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "grade" "Grade" NOT NULL,
    "analysis_comment" TEXT,
    "improvement_tips" TEXT[],
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "skills_status_idx" ON "skills"("status");

-- CreateIndex
CREATE INDEX "skills_author_id_idx" ON "skills"("author_id");

-- CreateIndex
CREATE INDEX "skills_created_at_idx" ON "skills"("created_at");

-- CreateIndex
CREATE INDEX "skills_deleted_at_idx" ON "skills"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "skills_author_id_name_key" ON "skills"("author_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_source_owner_source_repo_source_path_key" ON "skills"("source_owner", "source_repo", "source_path");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "skill_tags_tag_id_idx" ON "skill_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "tools_name_key" ON "tools"("name");

-- CreateIndex
CREATE INDEX "use_cases_skill_id_idx" ON "use_cases"("skill_id");

-- CreateIndex
CREATE INDEX "target_roles_skill_id_idx" ON "target_roles"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_scores_skill_id_key" ON "quality_scores"("skill_id");

-- CreateIndex
CREATE INDEX "quality_scores_total_score_idx" ON "quality_scores"("total_score");

-- CreateIndex
CREATE INDEX "quality_scores_grade_idx" ON "quality_scores"("grade");

-- CreateIndex
CREATE INDEX "reviews_skill_id_idx" ON "reviews"("skill_id");

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_skill_id_author_id_key" ON "reviews"("skill_id", "author_id");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_skill_id_key" ON "bookmarks"("user_id", "skill_id");

-- CreateIndex
CREATE INDEX "installs_user_id_idx" ON "installs"("user_id");

-- CreateIndex
CREATE INDEX "installs_skill_id_idx" ON "installs"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "installs_user_id_skill_id_key" ON "installs"("user_id", "skill_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tags" ADD CONSTRAINT "skill_tags_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tags" ADD CONSTRAINT "skill_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tools" ADD CONSTRAINT "skill_tools_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tools" ADD CONSTRAINT "skill_tools_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_roles" ADD CONSTRAINT "target_roles_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_scores" ADD CONSTRAINT "quality_scores_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installs" ADD CONSTRAINT "installs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installs" ADD CONSTRAINT "installs_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
