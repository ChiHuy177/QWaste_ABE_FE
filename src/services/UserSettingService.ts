import { ENDPOINTS } from './endpoints';
import { NetworkService } from './NetworkService';

export class UserSettingService {
    static updateReferences = async (newReferences: string[]) => {
        const response = await NetworkService.requestJson({
            method: 'PUT',
            url: ENDPOINTS.USER_SETTING.BASE,
            data: newReferences,
        });
        return response.result;
    };
}
