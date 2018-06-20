import * as R  from 'ramda';
import { of } from 'rxjs';
import { delay, filter, flatMap, map, mapTo, pluck, tap } from 'rxjs/operators';
import * as todos from 'app/todos/api';
import * as Routes from 'app/main/use-cases/router';

import {
  createAction,
  createReducer,
  combineEpics,
  reducers,
} from 'lib/useCase';

import { INITIALIZE } from 'app/main/store/initialize';

// Actions
// ---------------------------------------------------------------------------
export const actions = {
  COMPLETE_TODO: 'todos/complete',
  CREATE_TODO: 'todos/create',
  FETCH_TODOS: 'todos/fetch',
  REMOVE_TODO: 'todos/remove',
  SET_TODOS: 'todos/set',
  UPDATE_TODO: 'todos/update',
};

// Reducer
// ---------------------------------------------------------------------------
export const reducer = createReducer({
  init: [],
  [actions.SET_TODOS]: reducers.set,
  [actions.CREATE_TODO]: reducers.prepend,
  [actions.UPDATE_TODO]: reducers.mergeById,
  [actions.REMOVE_TODO]: reducers.removeById,
  [actions.COMPLETE_TODO]: (state, action) =>
    R.map(R.when(
      R.propEq('id', action.data.id),
      R.assoc('complete', true),
    )),
});

// Action Creators
// ---------------------------------------------------------------------------

export function removeTask (id) {
  return { type: actions.REMOVE_TODO, data: id };
}

export function updateTask (data) {
  return { type: actions.UPDATE_TODO, data };
}

// Epic
// ---------------------------------------------------------------------------
function initEpic (action$) {
  return action$
    .ofType(Routes.INIT_VIEW)
    .pipe(
      pluck('data'),
      filter(R.equals('todos')),
      mapTo({}),
      map(createAction(actions.FETCH_TODOS)),
    );
}

function fetchEpic (action$, state$, { request }) {
  return action$
    .ofType(actions.FETCH_TODOS)
    .pipe(
      flatMap(todos.fetch),
      map(createAction(actions.SET_TODOS))
    );
}

function stopLoadingEpic (action$) {
  return action$
    .ofType(actions.SET_TODOS)
    .pipe(
      delay(1500),
      mapTo('todos'),
      map(Routes.stopLoading),
    );
}

export const epic = combineEpics(
  initEpic,
  fetchEpic,
  stopLoadingEpic,
);

// Selectors
// ---------------------------------------------------------------------------
export const selectIncomplete = R.filter(R.propEq('complete', false));
export const selectComplete = R.filter(R.propEq('complete', true));