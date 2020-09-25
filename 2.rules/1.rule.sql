SELECT topic(3) AS id, state.reported.* 
FROM '$aws/things/+/shadow/update/accepted' 
WHERE state.reported.temperature >= 20