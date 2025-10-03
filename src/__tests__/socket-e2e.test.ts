import { createServer } from 'http';
import express from 'express';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import SocketService from '../services/SocketService';
import config from '../config';

describe('Socket.io End-to-End Real-time Communication Tests', () => {
  let app: express.Application;
  let httpServer: any;
  let socketService: SocketService;
  let serverPort: number;
  let userClients: ClientSocket[] = [];
  let merchantClients: ClientSocket[] = [];

  const createUserToken = (userId: string, walletAddress: string) => {
    return jwt.sign(
      { userId, walletAddress },
      config.jwtSecret || 'test-secret',
      { expiresIn: '1h' }
    );
  };

  beforeAll((done) => {
    // Create Express app and HTTP server
    app = express();
    app.use(express.json());
    httpServer = createServer(app);
    socketService = new SocketService(httpServer);
    
    // Set global socket service
    (global as any).socketService = socketService;

    // Start server
    httpServer.listen(() => {
      serverPort = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    // Disconnect all clients
    [...userClients, ...merchantClients].forEach(client => {
      if (client && client.connected) {
        client.disconnect();
      }
    });

    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  afterEach(() => {
    // Clean up clients after each test
    [...userClients, ...merchantClients].forEach(client => {
      if (client && client.connected) {
        client.disconnect();
      }
    });
    userClients = [];
    merchantClients = [];
  });

  describe('Lottery Draw Real-time Flow', () => {
    it('should handle complete lottery draw process with real-time updates', (done) => {
      const lotteryId = 'e2e-lottery-draw';
      const participants = ['user-1', 'user-2', 'user-3', 'user-4'];
      let connectedCount = 0;
      let drawStartedCount = 0;
      let drawCompletedCount = 0;
      let winnerAnnouncedCount = 0;

      const checkCompletion = () => {
        if (drawStartedCount === participants.length &&
            drawCompletedCount === participants.length &&
            winnerAnnouncedCount === participants.length) {
          done();
        }
      };

      // Create participant connections
      participants.forEach((userId, index) => {
        const token = createUserToken(userId, `0x${index}...abc`);
        const client = Client(`http://localhost:${serverPort}`, {
          auth: { token },
        });

        client.on('connect', () => {
          connectedCount++;
          
          // Join lottery room
          client.emit('join_lottery', { lotteryId });
          
          if (connectedCount === participants.length) {
            // Simulate lottery draw process
            setTimeout(() => {
              // 1. Draw started
              socketService.broadcastLotteryEvent({
                lotteryId,
                type: 'draw_started',
                data: { 
                  message: 'Lottery draw has begun!',
                  totalParticipants: participants.length
                },
                timestamp: new Date()
              });

              // 2. Draw completed (after 1 second)
              setTimeout(() => {
                socketService.broadcastLotteryEvent({
                  lotteryId,
                  type: 'draw_completed',
                  data: { 
                    message: 'Draw process completed',
                    processingTime: '1000ms'
                  },
                  timestamp: new Date()
                });

                // 3. Winner announced (after another second)
                setTimeout(() => {
                  socketService.broadcastLotteryEvent({
                    lotteryId,
                    type: 'winner_announced',
                    data: { 
                      winners: [participants[0], participants[2]],
                      prizes: ['NFT Coupon #1', 'NFT Coupon #2']
                    },
                    timestamp: new Date()
                  });
                }, 1000);
              }, 1000);
            }, 500);
          }
        });

        client.on('lottery_update', (data) => {
          expect(data.lotteryId).toBe(lotteryId);
          
          switch (data.type) {
            case 'draw_started':
              expect(data.data.totalParticipants).toBe(participants.length);
              drawStartedCount++;
              break;
            case 'draw_completed':
              expect(data.data.processingTime).toBe('1000ms');
              drawCompletedCount++;
              break;
            case 'winner_announced':
              expect(data.data.winners).toHaveLength(2);
              expect(data.data.prizes).toHaveLength(2);
              winnerAnnouncedCount++;
              break;
          }
          
          checkCompletion();
        });

        userClients.push(client);
      });
    });

    it('should send individual winner notifications', (done) => {
      const lotteryId = 'e2e-winner-notification';
      const winnerId = 'lucky-user-123';
      const winnerToken = createUserToken(winnerId, '0xwinner...abc');
      
      const winnerClient = Client(`http://localhost:${serverPort}`, {
        auth: { token: winnerToken },
      });

      winnerClient.on('connect', () => {
        // Simulate sending individual winner notification
        socketService.sendToUser(winnerId, 'lottery_winner', {
          lotteryId,
          prize: 'Rare NFT Coupon',
          message: 'Congratulations! You won the lottery!',
          claimInstructions: 'Visit your profile to claim your prize',
          timestamp: new Date()
        });
      });

      winnerClient.on('lottery_winner', (data) => {
        expect(data.lotteryId).toBe(lotteryId);
        expect(data.prize).toBe('Rare NFT Coupon');
        expect(data.message).toContain('Congratulations');
        expect(data.claimInstructions).toBeDefined();
        done();
      });

      userClients.push(winnerClient);
    });
  });

  describe('Location-based Promotion Broadcasting', () => {
    it('should broadcast promotions to users in specific geographic area', (done) => {
      const merchantId = 'hk-central-merchant';
      const centralLocation = { latitude: 22.2783, longitude: 114.1747, radius: 500 }; // Central, HK
      const causewayBayLocation = { latitude: 22.2793, longitude: 114.1847, radius: 500 }; // Causeway Bay, HK
      
      let centralUserReceived = false;
      let causewayBayUserReceived = false;
      let connectedCount = 0;

      // User in Central area
      const centralUserToken = createUserToken('central-user', '0xcentral...abc');
      const centralClient = Client(`http://localhost:${serverPort}`, {
        auth: { token: centralUserToken },
      });

      // User in Causeway Bay area
      const causewayBayUserToken = createUserToken('causeway-user', '0xcauseway...abc');
      const causewayBayClient = Client(`http://localhost:${serverPort}`, {
        auth: { token: causewayBayUserToken },
      });

      const checkCompletion = () => {
        if (centralUserReceived && !causewayBayUserReceived) {
          done(); // Only Central user should receive the promotion
        }
      };

      centralClient.on('connect', () => {
        connectedCount++;
        centralClient.emit('join_location', centralLocation);
        
        if (connectedCount === 2) {
          // Broadcast location-specific promotion
          setTimeout(() => {
            socketService.broadcastPromotion({
              merchantId,
              type: 'limited_offer',
              title: 'Central District Flash Sale!',
              description: '30% off for customers in Central area',
              location: centralLocation,
              data: {
                discount: 30,
                validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
                storeAddress: 'Shop 123, Central Building, Central, HK'
              },
              timestamp: new Date()
            });
          }, 200);
        }
      });

      causewayBayClient.on('connect', () => {
        connectedCount++;
        causewayBayClient.emit('join_location', causewayBayLocation);
        
        if (connectedCount === 2) {
          // Set timeout to check that Causeway Bay user doesn't receive promotion
          setTimeout(() => {
            if (!causewayBayUserReceived) {
              checkCompletion();
            }
          }, 1000);
        }
      });

      centralClient.on('promotion_update', (data) => {
        expect(data.merchantId).toBe(merchantId);
        expect(data.title).toBe('Central District Flash Sale!');
        expect(data.location).toEqual(centralLocation);
        expect(data.data.discount).toBe(30);
        centralUserReceived = true;
        checkCompletion();
      });

      causewayBayClient.on('promotion_update', () => {
        causewayBayUserReceived = true;
        // This should not happen for this test
      });

      userClients.push(centralClient, causewayBayClient);
    });

    it('should handle merchant-specific promotion updates', (done) => {
      const merchantId = 'favorite-merchant-456';
      let followerReceived = false;
      let nonFollowerReceived = false;
      let connectedCount = 0;

      // User following the merchant
      const followerToken = createUserToken('follower-user', '0xfollower...abc');
      const followerClient = Client(`http://localhost:${serverPort}`, {
        auth: { token: followerToken },
      });

      // User not following the merchant
      const nonFollowerToken = createUserToken('non-follower-user', '0xnonfollower...abc');
      const nonFollowerClient = Client(`http://localhost:${serverPort}`, {
        auth: { token: nonFollowerToken },
      });

      const checkCompletion = () => {
        if (followerReceived && !nonFollowerReceived) {
          done(); // Only follower should receive merchant-specific updates
        }
      };

      followerClient.on('connect', () => {
        connectedCount++;
        followerClient.emit('join_merchant', { merchantId });
        
        if (connectedCount === 2) {
          // Broadcast merchant-specific promotion
          setTimeout(() => {
            socketService.broadcastPromotion({
              merchantId,
              type: 'new_promotion',
              title: 'Exclusive Member Discount',
              description: 'Special offer for our loyal customers',
              data: {
                memberDiscount: 25,
                exclusiveItems: ['Premium NFT Collection', 'Limited Edition Coupons']
              },
              timestamp: new Date()
            });
          }, 200);
        }
      });

      nonFollowerClient.on('connect', () => {
        connectedCount++;
        // Don't join merchant room
        
        if (connectedCount === 2) {
          // Set timeout to check that non-follower doesn't receive promotion
          setTimeout(() => {
            if (!nonFollowerReceived) {
              checkCompletion();
            }
          }, 1000);
        }
      });

      followerClient.on('promotion_update', (data) => {
        expect(data.merchantId).toBe(merchantId);
        expect(data.title).toBe('Exclusive Member Discount');
        expect(data.data.memberDiscount).toBe(25);
        expect(data.data.exclusiveItems).toHaveLength(2);
        followerReceived = true;
        checkCompletion();
      });

      nonFollowerClient.on('promotion_update', () => {
        nonFollowerReceived = true;
        // This should not happen for this test
      });

      userClients.push(followerClient, nonFollowerClient);
    });
  });

  describe('Multi-user Notification Scenarios', () => {
    it('should handle system-wide maintenance notifications', (done) => {
      const userCount = 5;
      let notificationCount = 0;
      let connectedCount = 0;

      const checkCompletion = () => {
        if (notificationCount === userCount) {
          done();
        }
      };

      // Create multiple user connections
      for (let i = 0; i < userCount; i++) {
        const token = createUserToken(`system-user-${i}`, `0x${i}...system`);
        const client = Client(`http://localhost:${serverPort}`, {
          auth: { token },
        });

        client.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === userCount) {
            // Broadcast system maintenance notification
            setTimeout(() => {
              socketService.sendNotification({
                type: 'system',
                title: 'Scheduled Maintenance',
                message: 'Platform will be under maintenance from 2:00 AM to 4:00 AM HKT',
                data: {
                  maintenanceStart: '2024-01-01T02:00:00+08:00',
                  maintenanceEnd: '2024-01-01T04:00:00+08:00',
                  affectedServices: ['NFT Trading', 'Lottery System', 'Merchant Dashboard']
                },
                timestamp: new Date()
              });
            }, 200);
          }
        });

        client.on('notification', (data) => {
          expect(data.type).toBe('system');
          expect(data.title).toBe('Scheduled Maintenance');
          expect(data.data.affectedServices).toHaveLength(3);
          notificationCount++;
          checkCompletion();
        });

        userClients.push(client);
      }
    });

    it('should handle targeted user notifications', (done) => {
      const targetUsers = ['vip-user-1', 'vip-user-2'];
      const regularUsers = ['regular-user-1', 'regular-user-2'];
      let vipNotificationCount = 0;
      let regularNotificationCount = 0;
      let connectedCount = 0;

      const checkCompletion = () => {
        if (vipNotificationCount === targetUsers.length && regularNotificationCount === 0) {
          done(); // Only VIP users should receive the notification
        }
      };

      // Create VIP user connections
      targetUsers.forEach(userId => {
        const token = createUserToken(userId, `0x${userId}...vip`);
        const client = Client(`http://localhost:${serverPort}`, {
          auth: { token },
        });

        client.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === targetUsers.length + regularUsers.length) {
            // Send targeted VIP notification
            setTimeout(() => {
              socketService.sendNotification({
                type: 'merchant',
                title: 'VIP Exclusive Offer',
                message: 'Special NFT collection available for VIP members only',
                data: {
                  exclusiveCollection: 'Golden Dragon Series',
                  discount: 50,
                  limitedQuantity: 10
                },
                targetUsers,
                timestamp: new Date()
              });
            }, 200);
          }
        });

        client.on('notification', (data) => {
          expect(data.type).toBe('merchant');
          expect(data.title).toBe('VIP Exclusive Offer');
          expect(data.data.exclusiveCollection).toBe('Golden Dragon Series');
          vipNotificationCount++;
          checkCompletion();
        });

        userClients.push(client);
      });

      // Create regular user connections
      regularUsers.forEach(userId => {
        const token = createUserToken(userId, `0x${userId}...regular`);
        const client = Client(`http://localhost:${serverPort}`, {
          auth: { token },
        });

        client.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === targetUsers.length + regularUsers.length) {
            // Set timeout to verify regular users don't receive VIP notification
            setTimeout(() => {
              if (regularNotificationCount === 0) {
                checkCompletion();
              }
            }, 1000);
          }
        });

        client.on('notification', () => {
          regularNotificationCount++;
          // This should not happen for regular users in this test
        });

        userClients.push(client);
      });
    });
  });

  describe('Connection Resilience and Error Handling', () => {
    it('should handle client reconnection gracefully', (done) => {
      const userId = 'reconnect-user';
      const token = createUserToken(userId, '0xreconnect...abc');
      let connectionCount = 0;
      let disconnectionCount = 0;

      const client = Client(`http://localhost:${serverPort}`, {
        auth: { token },
        autoConnect: false,
      });

      client.on('connect', () => {
        connectionCount++;
        
        if (connectionCount === 1) {
          // First connection - disconnect after a short delay
          setTimeout(() => {
            client.disconnect();
          }, 100);
        } else if (connectionCount === 2) {
          // Second connection - test completed
          expect(socketService.isUserConnected(userId)).toBe(true);
          done();
        }
      });

      client.on('disconnect', () => {
        disconnectionCount++;
        
        if (disconnectionCount === 1) {
          // Reconnect after disconnection
          setTimeout(() => {
            client.connect();
          }, 100);
        }
      });

      // Start initial connection
      client.connect();
      userClients.push(client);
    });

    it('should handle malformed event data gracefully', (done) => {
      const userId = 'malformed-user';
      const token = createUserToken(userId, '0xmalformed...abc');
      
      const client = Client(`http://localhost:${serverPort}`, {
        auth: { token },
      });

      client.on('connect', () => {
        // Send various malformed events
        client.emit('join_lottery', null);
        client.emit('join_lottery', { invalidField: 'test' });
        client.emit('join_location', { latitude: 'invalid' });
        client.emit('join_merchant', 'not-an-object');
        client.emit('unknown_event', { data: 'test' });
        
        // Verify server is still responsive
        client.emit('ping');
      });

      client.on('pong', (data) => {
        expect(data.timestamp).toBeDefined();
        expect(socketService.getConnectedUsersCount()).toBe(1);
        done();
      });

      userClients.push(client);
    });

    it('should handle high-frequency message broadcasting', (done) => {
      const userId = 'high-freq-user';
      const token = createUserToken(userId, '0xhighfreq...abc');
      const messageCount = 50;
      let receivedCount = 0;
      
      const client = Client(`http://localhost:${serverPort}`, {
        auth: { token },
      });

      client.on('connect', () => {
        // Send high-frequency messages
        for (let i = 0; i < messageCount; i++) {
          setTimeout(() => {
            socketService.sendToUser(userId, 'high_freq_message', {
              index: i,
              timestamp: new Date(),
              data: `Message ${i}`
            });
          }, i * 10); // 10ms intervals
        }
      });

      client.on('high_freq_message', (data) => {
        expect(data.index).toBeDefined();
        expect(data.data).toContain('Message');
        receivedCount++;
        
        if (receivedCount === messageCount) {
          expect(receivedCount).toBe(messageCount);
          done();
        }
      });

      userClients.push(client);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle multiple concurrent lottery rooms', (done) => {
      const lotteryCount = 10;
      const usersPerLottery = 3;
      let totalUpdatesReceived = 0;
      let connectedCount = 0;
      const expectedUpdates = lotteryCount * usersPerLottery;

      const checkCompletion = () => {
        if (totalUpdatesReceived === expectedUpdates) {
          done();
        }
      };

      // Create multiple lotteries with multiple users each
      for (let lotteryIndex = 0; lotteryIndex < lotteryCount; lotteryIndex++) {
        const lotteryId = `concurrent-lottery-${lotteryIndex}`;
        
        for (let userIndex = 0; userIndex < usersPerLottery; userIndex++) {
          const userId = `lottery-${lotteryIndex}-user-${userIndex}`;
          const token = createUserToken(userId, `0x${lotteryIndex}${userIndex}...abc`);
          
          const client = Client(`http://localhost:${serverPort}`, {
            auth: { token },
          });

          client.on('connect', () => {
            connectedCount++;
            client.emit('join_lottery', { lotteryId });
            
            if (connectedCount === expectedUpdates) {
              // Broadcast to all lotteries simultaneously
              setTimeout(() => {
                for (let i = 0; i < lotteryCount; i++) {
                  socketService.broadcastLotteryEvent({
                    lotteryId: `concurrent-lottery-${i}`,
                    type: 'draw_started',
                    data: { lotteryIndex: i },
                    timestamp: new Date()
                  });
                }
              }, 200);
            }
          });

          client.on('lottery_update', (data) => {
            expect(data.lotteryId).toBe(lotteryId);
            expect(data.type).toBe('draw_started');
            expect(data.data.lotteryIndex).toBe(lotteryIndex);
            totalUpdatesReceived++;
            checkCompletion();
          });

          userClients.push(client);
        }
      }
    });

    it('should maintain performance with mixed room types', (done) => {
      const roomTypes = ['lottery', 'location', 'merchant'];
      const roomsPerType = 5;
      const usersPerRoom = 2;
      let connectedCount = 0;
      let broadcastsReceived = 0;
      const totalUsers = roomTypes.length * roomsPerType * usersPerRoom;
      const expectedBroadcasts = roomTypes.length * roomsPerType * usersPerRoom;

      const checkCompletion = () => {
        if (broadcastsReceived === expectedBroadcasts) {
          done();
        }
      };

      roomTypes.forEach((roomType, typeIndex) => {
        for (let roomIndex = 0; roomIndex < roomsPerType; roomIndex++) {
          for (let userIndex = 0; userIndex < usersPerRoom; userIndex++) {
            const userId = `${roomType}-${roomIndex}-user-${userIndex}`;
            const token = createUserToken(userId, `0x${typeIndex}${roomIndex}${userIndex}...mixed`);
            
            const client = Client(`http://localhost:${serverPort}`, {
              auth: { token },
            });

            client.on('connect', () => {
              connectedCount++;
              
              // Join appropriate room based on type
              switch (roomType) {
                case 'lottery':
                  client.emit('join_lottery', { lotteryId: `mixed-lottery-${roomIndex}` });
                  break;
                case 'location':
                  client.emit('join_location', { 
                    latitude: 22.3193 + roomIndex * 0.001, 
                    longitude: 114.1694 + roomIndex * 0.001, 
                    radius: 1000 
                  });
                  break;
                case 'merchant':
                  client.emit('join_merchant', { merchantId: `mixed-merchant-${roomIndex}` });
                  break;
              }
              
              if (connectedCount === totalUsers) {
                // Broadcast to all room types
                setTimeout(() => {
                  // Lottery broadcasts
                  for (let i = 0; i < roomsPerType; i++) {
                    socketService.broadcastLotteryEvent({
                      lotteryId: `mixed-lottery-${i}`,
                      type: 'draw_started',
                      data: { roomIndex: i },
                      timestamp: new Date()
                    });
                  }
                  
                  // Promotion broadcasts (for location and merchant rooms)
                  for (let i = 0; i < roomsPerType; i++) {
                    socketService.broadcastPromotion({
                      merchantId: `mixed-merchant-${i}`,
                      type: 'flash_sale',
                      title: `Mixed Sale ${i}`,
                      description: 'Performance test promotion',
                      location: {
                        latitude: 22.3193 + i * 0.001,
                        longitude: 114.1694 + i * 0.001,
                        radius: 1000
                      },
                      data: { roomIndex: i },
                      timestamp: new Date()
                    });
                  }
                }, 300);
              }
            });

            // Listen for appropriate events
            if (roomType === 'lottery') {
              client.on('lottery_update', (data) => {
                expect(data.lotteryId).toContain('mixed-lottery-');
                broadcastsReceived++;
                checkCompletion();
              });
            } else {
              client.on('promotion_update', (data) => {
                expect(data.merchantId).toContain('mixed-merchant-');
                broadcastsReceived++;
                checkCompletion();
              });
            }

            userClients.push(client);
          }
        }
      });
    });
  });
});