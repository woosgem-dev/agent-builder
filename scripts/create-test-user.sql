INSERT INTO users (id, github_id, username, email, created_at, updated_at) 
VALUES ('test-user-1', '12345', 'testuser', 'test@test.com', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;
