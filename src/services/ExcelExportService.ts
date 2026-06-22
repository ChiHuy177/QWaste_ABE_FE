import { ENDPOINTS } from './endpoints';
import { DownloadResult, NetworkService } from './NetworkService';

export class ExcelExportService {
    static async getMachineStatusLogReportByFilter(
        spaceId: number,
        filterId: number,
        shiftFilterId?: number | null
    ): Promise<DownloadResult> {
        let url = `${ENDPOINTS.EXCEL_EXPORT.MACHINE_STATUS_LOG_REPORT_BY_FILTER}?spaceId=${spaceId}&filterId=${filterId}`;
        if (shiftFilterId != null) url += `&shiftFilterId=${shiftFilterId}`;
        return await NetworkService.requestDownload({
            method: 'GET',
            url,
        });
    }

    static async getMachineStatusLogReportByDateRange(
        spaceId: number,
        startDate: string,
        endDate: string,
        filterId?: number | null
    ): Promise<DownloadResult> {
        let url = `${ENDPOINTS.EXCEL_EXPORT.MACHINE_STATUS_LOG_REPORT_BY_DATE_RANGE}?spaceId=${spaceId}&startDate=${startDate}&endDate=${endDate}`;
        if (filterId != null) url += `&filterId=${filterId}`;
        return await NetworkService.requestDownload({
            method: 'GET',
            url,
        });
    }
}
