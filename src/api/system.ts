import type { AdminAction, AdminActionResponse, SystemLog, SystemStatus } from '../types'
import { mockAdminAction, mockDelay, mockStore } from './client'
import { mockLogs } from './mockData'

export const systemApi = {
  getStatus: (): Promise<SystemStatus> => mockDelay(mockStore.getStatus()),
  getLogs: (): Promise<SystemLog[]> => mockDelay(mockLogs),
  requestAction: (action: AdminAction): Promise<AdminActionResponse> => mockAdminAction(action),
}
