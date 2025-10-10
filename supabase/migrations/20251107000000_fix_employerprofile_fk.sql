-- Ensure EmployerProfile foreign key references the lowercase user table
ALTER TABLE employerprofile
DROP CONSTRAINT IF EXISTS employerprofile_userid_fkey;

ALTER TABLE employerprofile
ADD CONSTRAINT employerprofile_userid_fkey
FOREIGN KEY ("userId") REFERENCES user(id) ON DELETE CASCADE;
