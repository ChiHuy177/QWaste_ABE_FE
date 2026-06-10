import axios from 'axios';
import { BrandingConfig } from '@/types/AppConfig';

export class BrandingService {
    //change to NetworkService when have API ready
    static async getBrandingConfig(): Promise<BrandingConfig> {
        const response = await axios.get<BrandingConfig>('/config/branding.json', {
            headers: {
                'Cache-Control': 'no-store',
            },
        });

        return response.data;
    }
}
