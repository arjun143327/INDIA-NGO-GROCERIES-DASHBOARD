import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMonthlyBudget(schoolId) {
  const [budgetData, setBudgetData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get current YYYY-MM
  const currentMonthYear = new Date().toISOString().substring(0, 7)

  const fetchBudget = useCallback(async () => {
    if (!schoolId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('school_id', schoolId)
      .eq('month_year', currentMonthYear)
      .maybeSingle()

    if (!error && data) {
      setBudgetData(data)
    } else {
      setBudgetData(null)
    }
    setLoading(false)
  }, [schoolId, currentMonthYear])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  const setStudentCount = async (count) => {
    if (!schoolId) return { error: 'No school ID' }
    
    const payload = {
      school_id: schoolId,
      month_year: currentMonthYear,
      student_count: count,
      budget_per_student: 2050, // default
    }

    if (budgetData) {
      // Update
      const { error } = await supabase
        .from('monthly_budgets')
        .update({ student_count: count })
        .eq('id', budgetData.id)
      
      if (!error) await fetchBudget()
      return { error }
    } else {
      // Insert
      const { error } = await supabase
        .from('monthly_budgets')
        .insert(payload)
        
      if (!error) await fetchBudget()
      return { error }
    }
  }

  const updateBudgetSettings = async (budgetId, count, budgetPerStudent) => {
    const { error } = await supabase
      .from('monthly_budgets')
      .update({ student_count: count, budget_per_student: budgetPerStudent })
      .eq('id', budgetId)
    
    if (!error) await fetchBudget()
    return { error }
  }

  return { budgetData, loading, currentMonthYear, setStudentCount, updateBudgetSettings, refetchBudget: fetchBudget }
}
