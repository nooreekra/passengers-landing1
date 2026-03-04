import axiosInstance from './axiosInstance';

/**
 * Подтверждение черновика транзакции
 * @param draftId - ID черновика транзакции
 * @returns Promise с результатом подтверждения
 */
export async function confirmDraftTransaction(draftId: string): Promise<string> {
  const response = await axiosInstance.post<string>(
    `/api/ingestion/transactions/drafts/${draftId}/confirm`
  );
  return response.data;
}


