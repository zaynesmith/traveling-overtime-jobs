-- CreateTable
CREATE TABLE user (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'jobseeker',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE employerprofile (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "officePhone" TEXT,
    "mobilePhone" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "website" TEXT,
    "timezone" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE jobseekerprofile (
    "id" TEXT NOT NULL,
    "trade" TEXT,
    "resumeUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "JobseekerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON user("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON employerprofile("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobseekerProfile_userId_key" ON jobseekerprofile("userId");

-- AddForeignKey
ALTER TABLE employerprofile ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE jobseekerprofile ADD CONSTRAINT "JobseekerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

