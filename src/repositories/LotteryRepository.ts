import { Lottery, LotteryConfig, LotteryPrize, ApiResponse, PaginatedResponse } from '../types';
import DatabaseConnection from '../database/connection';

export class LotteryRepository {
  constructor(private db: DatabaseConnection) {}

  async createLottery(lotteryData: LotteryConfig & { createdBy?: string }): Promise<Lottery> {
    const query = `
      INSERT INTO lotteries (
        name, name_en, name_zh_cn, description, description_en, description_zh_cn,
        entry_fee, total_prizes, remaining_prizes, prize_pool, start_time, end_time,
        created_by, terms_and_conditions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      lotteryData.name,
      lotteryData.name || null, // Default to main name if no English name
      lotteryData.name || null, // Default to main name if no Chinese name
      lotteryData.description,
      lotteryData.description || null,
      lotteryData.description || null,
      lotteryData.entryFee,
      lotteryData.totalPrizes,
      lotteryData.totalPrizes, // Initially remaining prizes = total prizes
      JSON.stringify(lotteryData.prizePool),
      lotteryData.startTime,
      lotteryData.endTime,
      lotteryData.createdBy || null,
      null // terms_and_conditions
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToLottery(result.rows[0]);
  }

  async getLotteryById(id: string): Promise<Lottery | null> {
    const query = 'SELECT * FROM lotteries WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToLottery(result.rows[0]);
  }

  async getActiveLotteries(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<Lottery>> {
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM lotteries 
      WHERE is_active = true AND start_time <= NOW() AND end_time > NOW()
    `;
    
    const dataQuery = `
      SELECT * FROM lotteries 
      WHERE is_active = true AND start_time <= NOW() AND end_time > NOW()
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query(countQuery),
      this.db.query(dataQuery, [limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const lotteries = dataResult.rows.map((row: any) => this.mapRowToLottery(row));

    return {
      success: true,
      data: lotteries,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateLottery(id: string, updates: Partial<Lottery>): Promise<Lottery | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbColumn = this.camelToSnake(key);
        if (key === 'prizePool') {
          setClause.push(`${dbColumn} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${dbColumn} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      return this.getLotteryById(id);
    }

    const query = `
      UPDATE lotteries 
      SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToLottery(result.rows[0]);
  }

  async participateInLottery(lotteryId: string, userId: string, entryCount: number = 1): Promise<boolean> {
    return await this.db.transaction(async (client) => {
      // Check if user already participated
      const existingParticipation = await client.query(
        'SELECT id FROM lottery_participants WHERE lottery_id = $1 AND user_id = $2',
        [lotteryId, userId]
      );

      if (existingParticipation.rows.length > 0) {
        throw new Error('User already participated in this lottery');
      }

      // Check lottery capacity
      const lotteryResult = await client.query(
        'SELECT max_participants, current_participants FROM lotteries WHERE id = $1',
        [lotteryId]
      );

      if (lotteryResult.rows.length === 0) {
        throw new Error('Lottery not found');
      }

      const { max_participants, current_participants } = lotteryResult.rows[0];
      
      if (max_participants && current_participants >= max_participants) {
        throw new Error('Lottery is full');
      }

      // Add participation record
      await client.query(
        `INSERT INTO lottery_participants (lottery_id, user_id, entry_count) 
         VALUES ($1, $2, $3)`,
        [lotteryId, userId, entryCount]
      );

      // Update current participants count
      await client.query(
        'UPDATE lotteries SET current_participants = current_participants + 1 WHERE id = $1',
        [lotteryId]
      );

      return true;
    });
  }

  async getLotteryParticipants(lotteryId: string): Promise<any[]> {
    const query = `
      SELECT lp.*, u.wallet_address, u.username
      FROM lottery_participants lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.lottery_id = $1
      ORDER BY lp.participated_at ASC
    `;
    
    const result = await this.db.query(query, [lotteryId]);
    return result.rows;
  }

  async getUserLotteryHistory(userId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResponse<any>> {
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM lottery_participants lp
      JOIN lotteries l ON lp.lottery_id = l.id
      WHERE lp.user_id = $1
    `;
    
    const dataQuery = `
      SELECT lp.*, l.name, l.name_en, l.name_zh_cn, l.entry_fee, l.image_url,
             l.start_time, l.end_time, l.is_completed
      FROM lottery_participants lp
      JOIN lotteries l ON lp.lottery_id = l.id
      WHERE lp.user_id = $1
      ORDER BY lp.participated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query(countQuery, [userId]),
      this.db.query(dataQuery, [userId, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      success: true,
      data: dataResult.rows,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getLotteryStatistics(lotteryId: string): Promise<any> {
    const query = `
      SELECT 
        l.*,
        COUNT(lp.id) as total_participants,
        COUNT(CASE WHEN lp.is_winner = true THEN 1 END) as total_winners,
        SUM(lp.entry_count) as total_entries
      FROM lotteries l
      LEFT JOIN lottery_participants lp ON l.id = lp.lottery_id
      WHERE l.id = $1
      GROUP BY l.id
    `;
    
    const result = await this.db.query(query, [lotteryId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      ...this.mapRowToLottery(result.rows[0]),
      statistics: {
        totalParticipants: parseInt(result.rows[0].total_participants) || 0,
        totalWinners: parseInt(result.rows[0].total_winners) || 0,
        totalEntries: parseInt(result.rows[0].total_entries) || 0
      }
    };
  }

  async markWinners(lotteryId: string, winners: { userId: string; prize: LotteryPrize }[]): Promise<boolean> {
    return await this.db.transaction(async (client) => {
      // Update winners
      for (const winner of winners) {
        await client.query(
          `UPDATE lottery_participants 
           SET is_winner = true, prize_won = $1 
           WHERE lottery_id = $2 AND user_id = $3`,
          [JSON.stringify(winner.prize), lotteryId, winner.userId]
        );
      }

      // Update lottery status
      await client.query(
        `UPDATE lotteries 
         SET is_completed = true, remaining_prizes = remaining_prizes - $1, draw_time = NOW()
         WHERE id = $2`,
        [winners.length, lotteryId]
      );

      return true;
    });
  }

  private mapRowToLottery(row: any): Lottery {
    return {
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      nameZhCn: row.name_zh_cn,
      description: row.description,
      descriptionEn: row.description_en,
      descriptionZhCn: row.description_zh_cn,
      entryFee: parseFloat(row.entry_fee),
      currency: row.currency,
      totalPrizes: row.total_prizes,
      remainingPrizes: row.remaining_prizes,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      prizePool: row.prize_pool ? JSON.parse(row.prize_pool) : [],
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      drawTime: row.draw_time ? new Date(row.draw_time) : undefined,
      isActive: row.is_active,
      isCompleted: row.is_completed,
      randomSeed: row.random_seed,
      winnerSelectionMethod: row.winner_selection_method,
      createdBy: row.created_by,
      imageUrl: row.image_url,
      termsAndConditions: row.terms_and_conditions,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}