import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyEquipments() {
  return useQuery({
    queryKey: ["my-equipments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipments").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useContents(filter?: { equipmentId?: string }) {
  return useQuery({
    queryKey: ["contents", filter?.equipmentId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("contents").select("*, equipments(name)").eq("published", true).order("sort_order").order("created_at", { ascending: false });
      if (filter?.equipmentId) q = q.eq("equipment_id", filter.equipmentId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
