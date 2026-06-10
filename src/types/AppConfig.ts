export interface BrandingConfig {
    appName: string;
    companyName: string;
    logo: {
        main: string;
        auth: string;
        favicon: string;
        poweredBy?: string;
    };

    colors: {
        primary: string;
        secondary?: string;
    };

    footer?: {
        copyright: string;
        poweredBy?: string;
    };
}
