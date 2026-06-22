import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class UtilsService {
    /**
     * GET Highest Space Level
     */
    static async getHighestSpaceLevel(): Promise<number> {
        const response = await NetworkService.requestJson<number>({
            method: 'GET',
            url: ENDPOINTS.UTILS.SPACE_LEVELS.HIGHEST,
        });
        return response.result as number;
    }
}
