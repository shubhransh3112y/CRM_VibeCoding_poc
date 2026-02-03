import React from 'react'
import { TableRow, TableCell, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material'

export type Column = { key: string; label?: string; type?: 'text'|'select'|'date'|'date-range' | string; options?: string[] }

export default function TableFilters({ columns, filters, onChange }: { columns: Column[]; filters: any; onChange: (next: any) => void }) {
  const set = (k: string, v: any) => onChange({ ...filters, [k]: v })

  return (
    <TableRow>
      {columns.map((col) => (
        <TableCell key={col.key}>
          {col.type === 'select' ? (
            <FormControl fullWidth size="small">
              <InputLabel>{col.label}</InputLabel>
              <Select
                value={filters[col.key] ?? ''}
                label={col.label}
                onChange={(e) => set(col.key, e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(col.options || []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          ) : col.type === 'date-range' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TextField
                type="date"
                size="small"
                label="From"
                value={(filters[col.key]?.from) ?? ''}
                onChange={(e) => set(col.key, { ...(filters[col.key] || {}), from: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                size="small"
                label="To"
                value={(filters[col.key]?.to) ?? ''}
                onChange={(e) => set(col.key, { ...(filters[col.key] || {}), to: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </div>
          ) : (
            <TextField
              size="small"
              fullWidth
              placeholder={col.label}
              value={filters[col.key] ?? ''}
              onChange={(e) => set(col.key, e.target.value)}
            />
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}
