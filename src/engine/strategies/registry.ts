import type { StrategyConfig } from '@/engine/types'
import type { Strategy } from './types'
import { DcaStrategy } from './dca'
import { LumpSumStrategy } from './lumpSum'
import { ValueAveragingStrategy } from './valueAveraging'
import { SmartDcaStrategy } from './smartDca'

export function createStrategy(config: StrategyConfig): Strategy {
  switch (config.type) {
    case 'dca':
      return new DcaStrategy()
    case 'lumpSum':
      return new LumpSumStrategy()
    case 'valueAveraging':
      return new ValueAveragingStrategy(config.targetGrowthRate)
    case 'smartDca':
      return new SmartDcaStrategy(
        config.smaPeriod,
        config.smaThreshold,
        config.dipMultiplier,
        config.rallyReducer
      )
  }
}
