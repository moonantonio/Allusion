import { action, makeObservable, observable } from 'mobx';
import React from 'react';
import { FileSearchCriteria } from 'src/frontend/stores/UiStore';

interface PinnedSearch {
  id: string;
  name: string;
  criteria: FileSearchCriteria[];
}

export class PinnedSearchStore {
  readonly tagList = observable(new Array<PinnedSearch>());

  constructor() {
    makeObservable(this);

    const restoredItemsStr = window.localStorage.getItem('pinnedSearches');
    const restoredItems = restoredItemsStr ? JSON.parse(restoredItemsStr) : [];

    this.tagList.push(
      // TODO: Restored items have no ClientCriteria, just plain objects
      ...restoredItems,
      // .map((x: PinnedSearch) => ({ ...x, criteria: new FileSearchCriteria() })),
    );

    // TODO: Filter out invalid searches: e.g. when tags are deleted. Or just show in UI as "INVALID!"
  }

  @action
  add(ps: PinnedSearch) {}

  save() {
    window.localStorage.setItem('pinnedSearches', JSON.stringify(this.tagList.toJSON()));
  }
}

const PinnedSearchContext = React.createContext<PinnedSearchStore>({} as PinnedSearchStore);

export default PinnedSearchContext;
