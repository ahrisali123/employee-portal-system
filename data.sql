-- departments
INSERT INTO departments(
    id, code, name)
VALUES
    ('68178616-b4ba-475a-9402-ee440bc15683','IT','システム部'),
    ('7d9e64f8-3b88-4189-b4db-f038822e695d','DEV','開発部'),
    ('94f8d171-9d27-4984-87c4-8680393b546a','HR','人事部'),
    ('e723ce6b-72fb-41b8-b3db-2d290878c013','OPS','総務部'),
    ('f93d8fb4-d267-4024-a0a3-973ff01c0240','FIN','経理部')
    ON CONFLICT DO NOTHING;

-- users
INSERT INTO users(
    id, name, email, password, department_id)
VALUES
    ('55d6513a-766e-4faa-8ac7-2345cace38fe','山田','adminandemployee@shanai-portal.online','$2a$12$e/UVlGPhBR3XALQWSBUkMOxOQrhnQA1bEpvlG9Bu6TuQPBQ.3xcwq','7d9e64f8-3b88-4189-b4db-f038822e695d'),
    ('6dc17f07-70b9-4153-9196-77da4a8285f4','田中','employee@shanai-portal.online','$2a$12$l/0.yBACJsek9XQxz.mQvujt//YNhQU1.lZ08lpAdBdKUGbr4S3zS','7d9e64f8-3b88-4189-b4db-f038822e695d'),
    ('d376e3e8-1074-40dd-b1f3-5540deac5245','渡辺','admin@shanai-portal.online','$2a$12$WBhnZun3RBq5jLPYxRF8/edEB4P58v0VBQpyhWL3wcT.Kml6B/fpK','f93d8fb4-d267-4024-a0a3-973ff01c0240')
    ON CONFLICT DO NOTHING;

-- user_roles
INSERT INTO user_roles(
    user_id, role)
VALUES
    ('55d6513a-766e-4faa-8ac7-2345cace38fe','ADMIN'),
    ('55d6513a-766e-4faa-8ac7-2345cace38fe','EMPLOYEE'),
    ('6dc17f07-70b9-4153-9196-77da4a8285f4','EMPLOYEE'),
    ('d376e3e8-1074-40dd-b1f3-5540deac5245','ADMIN')
    ON CONFLICT DO NOTHING;