import Player from '../models/Player';

export interface LBResult {
  page: number;
  pages: number;
  players: Player[];
  total: number;
}
export async function getLeaderBoard(page = 1): Promise<LBResult> {
  const limit = 10;

  if (page < 1) {
    page = 1;
  }

  const offset = page <= 1 ? 0 : (page - 1) * limit;

  const {rows, count} = await Player.findAndCountAll({
    limit,
    offset,
    order: [['candy', 'DESC']],
  });

  const pages = Math.ceil(count / limit);

  return {
    page,
    pages,
    total: count,
    players: rows,
  };
}
