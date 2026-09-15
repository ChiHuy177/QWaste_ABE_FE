import { ENDPOINTS } from './endpoints';
import { NetworkService } from './NetworkService';
import { UserPreference } from '@/types/User';

export interface UpdateUserPreferencesRequest {
    preferences: Partial<UserPreference>;
}

export class UserSettingService {
    static updateReferences = async (newReferences: UpdateUserPreferencesRequest) => {
        const response = await NetworkService.requestJson({
            method: 'PUT',
            url: ENDPOINTS.USER_SETTING.BASE,
            data: newReferences,
        });
        return response.result;
    };
}
