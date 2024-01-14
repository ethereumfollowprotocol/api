### Metrics Summary Table

| Run  | Total Supply | Num List Ops | Num Events |
|------|--------------|--------------|------------|
| Run 1| 51           | 94           | 407        |
| Run 2| 75           | 1594         | 2051       |
| Run 3| 100          | 3769         | 4376       |
| Run 4| 125          | 6569         | 7326       |
| Run 5| 150          | 9994         | 10901      |
| Run 6| 200          | 18719        | 19926      |


### Endpoint Performance Table

| Endpoint                                    | Run 1 (ms)     | Run 2 (ms)     | Run 3 (ms)     | Run 4 (ms)     | Run 5 (ms)     | Run 6 (ms)     |
|---------------------------------------------|----------------|----------------|----------------|----------------|----------------|----------------|
| `/debug/total-supply`                       | 13             | 14             | 13             | 13             | 14             | 15             |
| `/debug/num-list-ops`                       | 12             | 13             | 13             | 15             | 13             | 15             |
| `/debug/num-events`                         | 13             | 13             | 14             | 14             | 13             | 14             |
|                                             |                |                |                |                |                |                |
|                                             |                |                |                |                |                |                |
| `/users/dr3a.eth/ens`                       | 88             | 112            | 100            | 236            | 86             | 87             |
| `/users/dr3a.eth/primary-list`              | 76             | 83             | 99             | 238            | 130            | 181            |
| `/users/dr3a.eth/following`                 | 79             | 112            | 138            | 154            | 166            | 264            |
| `/users/dr3a.eth/followers`                 | **1653**       | **3280**       | **5359**       | **7828**       | **10262**      | **15821**      |
| `/users/dr3a.eth/stats`                     | **1675**       | **3334**       | **5396**       | **8006**       | **10823**      | **16049**      |
|                                             |                |                |                |                |                |                |
|                                             |                |                |                |                |                |                |
| `/lists/0/records?includeTags=false`        | 18             | 35             | 59             | 91             | 130            | 221            |
| `/lists/0/records?includeTags=true`         | 28             | **2030**       | **9486**       | **28215**      | TIMEOUT        | TIMEOUT        |
|                                             |                |                |                |                |                |                |
|                                             |                |                |                |                |                |                |
| `/leaderboard/blocked?limit=10`             | 113            | **2611**       | **10610**      | TIMEOUT        | TIMEOUT        | TIMEOUT        |
| `/leaderboard/blocks?limit=10`              | 113            | **2249**       | **10590**      | TIMEOUT        | TIMEOUT        | TIMEOUT        |
| `/leaderboard/muted?limit=10`               | 113            | **2244**       | **10659**      | TIMEOUT        | TIMEOUT        | TIMEOUT        |
| `/leaderboard/mutes?limit=10`               | 112            | **2250**       | **10605**      | TIMEOUT        | TIMEOUT        | TIMEOUT        |
| `/leaderboard/followers?limit=10`           | **1003**       | TIMEOUT        | TIMEOUT        | TIMEOUT        | TIMEOUT        | TIMEOUT        |
| `/leaderboard/following?limit=10`           | **1006**       | TIMEOUT        | TIMEOUT        | TIMEOUT        | TIMEOUT        | TIMEOUT        |
