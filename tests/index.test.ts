import request from 'supertest'
/*
 * This file contains tests for the EFP API endpoints.
 * It uses Vitest and Supertest to perform HTTP GET requests to each endpoint
 * and checks for a 200 OK response.  Please ensure the EFP API is running and
 * accessible at the specified server URL before running these tests.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let server: any

beforeAll(() => {
  server = 'http://localhost:8787'
})

afterAll(() => {
  server = null
})

// biome-ignore lint/nursery/noSecrets: <explanation>
const endpoints = [
  '/api/v1/discover',
  '/api/v1/leaderboard/ranked?sort=mutuals&direction=desc&cache=fresh',
  '/api/v1/leaderboard/search?term=eth',
  '/api/v1/lists/3/details?cache=fresh',
  '/api/v1/lists/4/allFollowers',
  '/api/v1/lists/4/allFollowing',
  '/api/v1/lists/4/allFollowingAddresses?cache=fresh',
  '/api/v1/lists/9/badges?cache=fresh',
  '/api/v1/lists/9/0x983110309620d911731ac0932219af06091b6744/buttonState?cache=fresh',
  '/api/v1/lists/3/details?cache=fresh',
  '/api/v1/lists/4/followers?cache=fresh',
  '/api/v1/lists/3/0xc983ebc9db969782d994627bdffec0ae6efee1b3/followerState?cache=fresh',
  '/api/v1/lists/9/following?cache=fresh',
  '/api/v1/lists/4/latestFollowers?cache=fresh',
  '/api/v1/lists/1/recommended',
  '/api/v1/lists/4/searchFollowers?term=crypt',
  '/api/v1/lists/9/searchFollowing?term=bran',
  '/api/v1/lists/3/stats?cache=fresh',
  '/api/v1/lists/41/taggedAs',
  '/api/v1/lists/3/tags',
  '/api/v1/stats?cache=fresh',
  '/api/v1/users/encrypteddegen.eth/account',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/badges?cache=fresh',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/allFollowers?cache=fresh',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/allFollowing?cache=fresh',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/commonFollowers?leader=0x0312567d78ff0c9ce0bd62a250df5c6474c71334',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/details?cache=fresh',
  '/api/v1/users/0x983110309620d911731ac0932219af06091b6744/ens',
  '/api/v1/users/encrypteddegen.eth/followers?cache=fresh',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/0x983110309620d911731ac0932219af06091b6744/followerState?cache=fresh',
  '/api/v1/users/encrypteddegen.eth/following?cache=fresh',
  '/api/v1/users/encrypteddegen.eth/latestFollowers?cache=fresh',
  '/api/v1/users/0xc983ebc9db969782d994627bdffec0ae6efee1b3/list-records',
  '/api/v1/users/0x983110309620d911731ac0932219af06091b6744/lists?cache=fresh',
  // biome-ignore lint/nursery/noSecrets: <explanation>
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/notifications?cache=fresh',
  '/api/v1/users/0xc983ebc9db969782d994627bdffec0ae6efee1b3/primary-list',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/recommended',
  // biome-ignore lint/nursery/noSecrets: <explanation>
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/searchFollowers?term=brant',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/searchFollowing?term=degen',
  '/api/v1/users/limes.eth/stats?cache=fresh&live=true',
  '/api/v1/users/0xc9c3a4337a1bba75d0860a1a81f7b990dc607334/taggedAs',
  '/api/v1/users/0x983110309620d911731ac0932219af06091b6744/tags'
]

describe('EFP API Tests', () => {
  for (const endpoint of endpoints) {
    it(endpoint, async () => {
      const response = await request(server).get(endpoint)
      expect(response.status).toBe(200)
    })
  }
})
