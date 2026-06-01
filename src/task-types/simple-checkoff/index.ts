import { registerTaskType } from '../registry';
import { SimpleCheckoffDetail } from './detail';
import { SimpleCheckoffHistory } from './history';

registerTaskType({
  key: 'simple-checkoff',
  label: 'Simple Checkoff',
  DetailScreen: SimpleCheckoffDetail,
  HistoryScreen: SimpleCheckoffHistory,
});
