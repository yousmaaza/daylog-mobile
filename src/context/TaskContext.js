import React, { createContext, useContext } from 'react'
import { useTasks } from '../hooks/useTasks'

const TaskContext = createContext(null)

export function TaskProvider({ children }) {
  const value = useTasks()
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTaskContext() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider')
  return ctx
}
