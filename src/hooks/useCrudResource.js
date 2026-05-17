import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function useCrudResource({
  table,
  select = '*',
  orderBy = 'created_at',
  ascending = false,
  filters = [],
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableFilters = useMemo(
    () => filters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase.from(table).select(select)

    stableFilters.forEach((filter) => {
      if (!filter) return
      const { column, value, operator = 'eq' } = filter
      if (value === undefined || value === null || value === '') return
      query = query[operator](column, value)
    })

    if (orderBy) {
      query = query.order(orderBy, { ascending })
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
      setItems([])
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }, [table, select, orderBy, ascending, stableFilters])

  useEffect(() => {
    load()
  }, [load])

  const createItem = useCallback(
    async (payload) => {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      setItems((prev) => [data, ...prev])
      return data
    },
    [table]
  )

  const updateItem = useCallback(
    async (id, payload) => {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setItems((prev) => prev.map((item) => (item.id === id ? data : item)))
      return data
    },
    [table]
  )

  const deleteItem = useCallback(
    async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    [table]
  )

  return {
    items,
    loading,
    error,
    load,
    createItem,
    updateItem,
    deleteItem,
  }
}
