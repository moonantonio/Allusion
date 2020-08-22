import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { Button, TagInput, FocusStyleManager, Switch } from '@blueprintjs/core';
import { CSSTransition } from 'react-transition-group';
import StoreContext, { IRootStoreProp } from '../../contexts/StoreContext';
import IconSet from 'components/Icons';
import { ClientTag } from '../../../entities/Tag';
import {
  ClientIDSearchCriteria,
  ClientCollectionSearchCriteria,
} from '../../../entities/SearchCriteria';
import MultiTagSelector from '../../components/MultiTagSelector';
import { ClientTagCollection } from '../../../entities/TagCollection';
import { isNotUndefined } from '../../utils';
import { ItemRenderer, MultiSelect, ItemPredicate } from '@blueprintjs/select';

export const QuickSearchList = observer(() => {
  const { uiStore, tagStore, tagCollectionStore } = useContext(StoreContext);

  const selectedItems = uiStore.searchCriteriaList
    .map((c) =>
      c instanceof ClientIDSearchCriteria && c.value.length === 1
        ? tagStore.get(c.value[0])
        : c instanceof ClientCollectionSearchCriteria
        ? tagCollectionStore.get(c.collectionId)
        : undefined,
    )
    .filter(isNotUndefined);

  const handleSelectTag = useCallback(
    (tag: ClientTag) => {
      uiStore.addSearchCriteria(new ClientIDSearchCriteria('tags', tag.id, tag.name));
    },
    [uiStore],
  );

  const handleSelectCol = useCallback(
    (col: ClientTagCollection) => {
      uiStore.addSearchCriteria(
        new ClientCollectionSearchCriteria(col.id, col.getTagsRecursively(), col.name),
      );
    },
    [uiStore],
  );

  const handleDeselectTag = useCallback(
    (tag: ClientTag) => {
      const crit = uiStore.searchCriteriaList.find(
        (c) => c instanceof ClientIDSearchCriteria && c.value.includes(tag.id),
      );
      if (crit) {
        uiStore.removeSearchCriteria(crit);
      }
    },
    [uiStore],
  );

  const handleDeselectCol = useCallback(
    (col: ClientTagCollection) => {
      const crit = uiStore.searchCriteriaList.find(
        (c) => c instanceof ClientCollectionSearchCriteria && c.collectionId === col.id,
      );
      if (crit) {
        uiStore.removeSearchCriteria(crit);
      }
    },
    [uiStore],
  );

  const handleCloseSearch = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key.toLowerCase() === uiStore.hotkeyMap.closeSearch) {
        e.preventDefault();
        // Prevent react update on unmounted component while searchbar is closing
        uiStore.closeQuickSearch();
      }
    },
    [uiStore],
  );

  const selectorRef = useRef<MultiSelect<ClientTag | ClientTagCollection> | null>(null);
  const setSelectorRef = useCallback((ref: MultiSelect<ClientTag | ClientTagCollection> | null) => {
    selectorRef.current = ref;
  }, []);

  const handleBlur = useCallback(() => {
    console.log({ isPopoverOpen: selectorRef.current?.state.isOpen });
    if (!selectorRef.current?.state.isOpen) {
      uiStore.closeQuickSearch();
    }
    setTimeout(() => {
      if (!selectorRef.current?.state.isOpen) {
        uiStore.closeQuickSearch();
      }
    }, 100);
  }, [uiStore]);

  const handleClear = useCallback(() => {
    uiStore.clearSearchCriteriaList();
    uiStore.closeQuickSearch();
  }, [uiStore]);

  return (
    <>
      <MultiTagSelector
        selectorRef={setSelectorRef}
        selectedItems={selectedItems}
        onTagSelect={handleSelectTag}
        onTagDeselect={handleDeselectTag}
        onClearSelection={handleClear}
        // autoFocus={!uiStore.isAdvancedSearchOpen} // don't auto focus with advanced search open; focus is needed there instead
        tagIntent="primary"
        onKeyDown={handleCloseSearch}
        showClearButton={selectedItems.length > 0}
        includeCollections
        onTagColDeselect={handleDeselectCol}
        onTagColSelect={handleSelectCol}
        onFocus={uiStore.openQuickSearch}
        onBlur={handleBlur}
        fill
      />
      {uiStore.isQuickSearchOpen && (
        <>
          <Switch
            // inline
            // label="Match"
            innerLabel="All"
            innerLabelChecked="Any"
            alignIndicator="right"
            checked={uiStore.searchMatchAny}
            onChange={uiStore.toggleSearchMatchAny}
          />
          <Button
            minimal
            icon={IconSet.SEARCH_EXTENDED}
            onClick={uiStore.toggleAdvancedSearch}
            title="Advanced search"
          />
        </>
      )}
    </>
  );
});

interface ICriteriaList {
  criterias: React.ReactNode[];
  removeCriteriaByIndex: (index: number) => void;
  toggleAdvancedSearch: () => void;
}

const CriteriaList = ({
  criterias,
  toggleAdvancedSearch,
  removeCriteriaByIndex,
}: ICriteriaList) => {
  const preventTyping = (e: React.KeyboardEvent<HTMLElement>, i?: number) => {
    // If it's not an event on an existing Tag element, ignore it
    if (i === undefined && !e.ctrlKey) {
      e.preventDefault();
    }
  };

  // Open advanced search when clicking one of the criteria (but not their delete buttons)
  const handleTagClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'SPAN') {
      toggleAdvancedSearch();
    }
  };

  return (
    <div id="criteria-list">
      <TagInput
        values={criterias}
        onRemove={(_, i) => removeCriteriaByIndex(i)}
        inputProps={{ disabled: true, onMouseUp: toggleAdvancedSearch }}
        onKeyDown={preventTyping}
        tagProps={{ minimal: true, intent: 'primary', onClick: handleTagClick, interactive: true }}
        fill
      />
    </div>
  );
};

export const Searchbar = observer(() => {
  const rootStore = useContext(StoreContext);
  const {
    uiStore: {
      isQuickSearchOpen,
      searchCriteriaList,
      openQuickSearch,
      closeQuickSearch,
      toggleAdvancedSearch,
      removeSearchCriteriaByIndex,
    },
    tagStore,
  } = rootStore;

  // Only show quick search bar when all criteria are tags or collections, else
  // show a search bar that opens to the advanced search form
  const isQuickSearch =
    searchCriteriaList.length === 0 ||
    searchCriteriaList.every((crit) => crit.key === 'tags' && crit.operator === 'contains');

  // Open searchbar on adding queries
  useEffect(() => {
    if (searchCriteriaList.length > 0 && !isQuickSearchOpen) {
      openQuickSearch();
    }
  }, [isQuickSearchOpen, openQuickSearch, searchCriteriaList.length]);

  const criterias = searchCriteriaList.map((c) => {
    const label = c.toString();
    if (c instanceof ClientIDSearchCriteria && c.value.length === 1) {
      const tag = tagStore.get(c.value[0]);
      if (tag) {
        return label.concat(tag.name);
      }
    }
    return label;
  });

  return (
    <CSSTransition in={isQuickSearchOpen} classNames="quick-search" timeout={200} unmountOnExit>
      <div className="quick-search">
        <Button
          minimal
          icon={IconSet.SEARCH_EXTENDED}
          onClick={toggleAdvancedSearch}
          title="Advanced search"
        />
        {isQuickSearch ? (
          <QuickSearchList />
        ) : (
          <CriteriaList
            criterias={criterias}
            toggleAdvancedSearch={toggleAdvancedSearch}
            removeCriteriaByIndex={removeSearchCriteriaByIndex}
          />
        )}
        <Button minimal icon={IconSet.CLOSE} onClick={closeQuickSearch} title="Close (Escape)" />
      </div>
    </CSSTransition>
  );
});

export const ExpandingSearchInput = observer(() => {
  const rootStore = useContext(StoreContext);
  const {
    uiStore: {
      isQuickSearchOpen,
      searchCriteriaList,
      openQuickSearch,
      closeQuickSearch,
      toggleAdvancedSearch,
      removeSearchCriteriaByIndex,
    },
    tagStore,
  } = rootStore;

  const criterias = searchCriteriaList.map((c) => {
    const label = c.toString();
    if (c instanceof ClientIDSearchCriteria && c.value.length === 1) {
      const tag = tagStore.get(c.value[0]);
      if (tag) {
        return label.concat(tag.name);
      }
    }
    return label;
  });

  // Open advanced search when clicking one of the criteria (but not their delete buttons)
  const handleTagClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'SPAN') {
      openQuickSearch();
    }
  };

  const preventTyping = (e: React.KeyboardEvent<HTMLElement>, i?: number) => {
    // If it's not an event on an existing Tag element, ignore it
    if (i === undefined && !e.ctrlKey) {
      e.preventDefault();
    }
  };

  console.log({ isQuickSearchOpen });

  return (
    // <div id="expanding-search-list criteria-list">
    <TagInput
      // leftIcon={IconSet.SEARCH} // <-- alignment issue
      leftIcon="search"
      placeholder="Search"
      values={criterias}
      // onRemove={(_, i) => removeCriteriaByIndex(i)}
      inputProps={{
        onFocus: openQuickSearch,
        onBlur: closeQuickSearch,
      }}
      onKeyDown={preventTyping}
      tagProps={{
        minimal: true,
        intent: 'primary',
        onClick: handleTagClick,
        interactive: true,
      }}
      fill
    />
    // </div>
  );
});

export default Searchbar;
