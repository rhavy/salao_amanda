import { useState, useEffect } from 'react';
import { getFinanceData } from '../services/api';

export interface FinanceData {
    real: number;
    projection: number;
    count: number;
    totalYear: number;
}

export function useFinanceData(month: number, year: number) {
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const data = await getFinanceData(month, year);
                setFinanceData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch finance data');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [month, year]);

    return { financeData, loading, error };
}
