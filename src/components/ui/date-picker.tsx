import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import 'react-day-picker/style.css'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const defaultClassNames = getDefaultClassNames()
  const selected = value ? parseISO(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) onChange(format(date, 'yyyy-MM-dd'))
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground',
            'flex items-center gap-2 text-left',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'hover:bg-muted/50 transition-colors'
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {selected ? format(selected, 'MMM d, yyyy') : 'Pick a date'}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-lg border border-input bg-card p-3 shadow-lg"
          align="start"
          sideOffset={4}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
            classNames={{
              root: cn(defaultClassNames.root, 'text-foreground'),
              month_caption:
                'flex items-center justify-center py-1 mb-2 font-medium text-sm',
              nav: 'flex items-center gap-1',
              button_previous: cn(
                defaultClassNames.button_previous,
                'absolute left-1 top-1 h-7 w-7 rounded-md border border-input bg-card hover:bg-muted flex items-center justify-center'
              ),
              button_next: cn(
                defaultClassNames.button_next,
                'absolute right-1 top-1 h-7 w-7 rounded-md border border-input bg-card hover:bg-muted flex items-center justify-center'
              ),
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'text-muted-foreground text-xs font-medium w-9 text-center pb-2',
              week: 'flex w-full mt-1',
              day: 'h-9 w-9 text-center text-sm p-0 relative rounded-md hover:bg-muted cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring',
              day_button: 'h-9 w-9 flex items-center justify-center rounded-md',
              selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              today: 'border border-primary text-primary font-medium',
              outside: 'text-muted-foreground opacity-50',
              disabled: 'text-muted-foreground opacity-30 cursor-not-allowed',
              chevron: 'h-4 w-4 fill-foreground',
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
