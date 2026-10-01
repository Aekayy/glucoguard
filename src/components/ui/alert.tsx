import type { SVGProps } from 'react'

import { Icon } from '@/components/icons'

/* Stand-ins for the paid @kobra/alert marks, drawn from the Hearth icon set. */
export type AlertTone = 'success' | 'error' | 'warning' | 'info'

type Mark = (props: Omit<SVGProps<SVGSVGElement>, 'name'>) => React.ReactElement

export const ALERT_MARKS: Record<Exclude<AlertTone, 'success'>, Mark> = {
  error: (props) => <Icon name="alert" size={20} {...props} />,
  warning: (props) => <Icon name="alert" size={18} {...props} />,
  info: (props) => <Icon name="info" size={18} {...props} />,
}
