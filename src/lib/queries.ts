import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMinhasLocacoes(clienteId?: string) {
  return useQuery({
    queryKey: ["locacoes", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes")
        .select("*, equipamentos(*)")
        .eq("cliente_id", clienteId!)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMeusCustos(clienteId?: string) {
  return useQuery({
    queryKey: ["custos", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 1, 1);
      const iso = since.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("custos_diarios")
        .select("*")
        .eq("cliente_id", clienteId!)
        .gte("data", iso)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
