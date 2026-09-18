// Supabase Client Helper for saving student quiz results in 'm-e-v' table
export const SUPABASE_URL = 'https://ggjfmosjkiahmgeromhs.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_QxZE9QKmvgPG5QFxq5w7_w_tI4n8sGj';
export const TABLE_NAME = 'm-e-v';

export interface MevRecord {
  nome_grupo: string;
  acertos: number;
  total_itens: number;
}

// Submits the quiz result to Supabase 'm-e-v' table using robust try/catch/finally handling
export async function submitMevResult(data: MevRecord): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try official client injected via CDN script if available
    const win = window as unknown as {
      supabase?: {
        createClient: (url: string, key: string) => {
          from: (table: string) => {
            insert: (records: unknown[]) => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };

    if (win.supabase?.createClient) {
      try {
        const client = win.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error } = await client.from(TABLE_NAME).insert([
          {
            nome_grupo: data.nome_grupo,
            acertos: data.acertos,
            total_itens: data.total_itens,
          },
        ]);
        if (!error) {
          return { success: true };
        }
        console.warn('Supabase SDK insert error, attempting REST fallback:', error);
      } catch (err) {
        console.warn('Supabase SDK initialization/insert error, fallback to REST:', err);
      }
    }

    // 2. Direct REST endpoint fallback to ensure delivery
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nome_grupo: data.nome_grupo,
        acertos: data.acertos,
        total_itens: data.total_itens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Erro na resposta da rede');
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.error('Error submitting result to Supabase m-e-v table:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    // Guaranteed finalization log
    console.log('Finalizada a tentativa de envio para a tabela m-e-v do Supabase.');
  }
}
