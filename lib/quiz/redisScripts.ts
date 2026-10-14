// Pipelines batch transport; Lua makes these decisions and writes indivisible.
export const AUTH_WINDOW_SCRIPT = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if not count or count < 0 or count % 1 ~= 0 then return redis.error_reply('Invalid failure counter') end
if count >= 5 then return 0 end
if ARGV[1] == 'success' then return 1 end
local failures = redis.call('INCR', KEYS[1])
if failures == 1 then redis.call('EXPIRE', KEYS[1], 600) end
return -1
`;
export const DELETE_QUIZ_SCRIPT = `
local removed = redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[2])
return removed
`;
export const RECORD_ATTEMPT_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end
return redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
`;
