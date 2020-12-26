import { IconSet } from 'components/Icons';
import { Toolbar, ToolbarButton } from 'components/menu';
import React, { useContext, useState, useCallback } from 'react';
import { RendererMessenger } from 'src/Messaging';
import { ClientLocation } from 'src/renderer/entities/Location';
import StoreContext from 'src/renderer/frontend/contexts/StoreContext';
import useContextMenu from 'src/renderer/frontend/hooks/useContextMenu';
import { Collapse } from 'src/renderer/frontend/components/Transition';
import { FileSearchCriteria } from 'src/renderer/frontend/stores/UiStore';
import { observer } from 'mobx-react-lite';

const enum Tooltip {
  Add = 'Pin current search',
}

interface IPinnedSearch {
  id: string;
  name: string;
  criteria: FileSearchCriteria[];
}

const PinnedSearchItem = (item: IPinnedSearch) => {
  const { uiStore } = useContext(StoreContext);
  return (
    <div onClick={() => uiStore.replaceSearchCriterias(item.criteria)}>
      {item.name}

      {/* TODO: edit + trash buttonon hover */}
    </div>
  )
}

const PinnedSearchPanel = observer(() => {
  const { uiStore } = useContext(StoreContext);
  const [contextState, { show, hide }] = useContextMenu();

  const [pinnedSearches, setPinnedSearches] = useState<IPinnedSearch[]>([]);

  const [isCollapsed, setCollapsed] = useState(true);

  const handlePin = useCallback(() => {
    window.alert('TODO: Pin' + uiStore.searchCriteriaList);
    setPinnedSearches(current => [...current, {
      id: Math.random().toString(),
      name: 'New pinned search',
      criteria: uiStore.searchCriteriaList.toJSON(),
    }]);
  }, [uiStore.searchCriteriaList]);

  // TODO: Re-use advanced search panel for modifying pinned searches

  // TODO: Would be nice to have those vscode style resizable collapses
  return (
    <div className="section">
      <header>
        <span onClick={() => setCollapsed(!isCollapsed)}>Pinned searches</span>
        <Toolbar controls="pinned-search-list">
          <ToolbarButton
            showLabel="never"
            // TODO: Pin icon
            icon={IconSet.SEARCH}
            text="Pin current search query"
            onClick={handlePin}
            disabled={!uiStore.searchCriteriaList.length}
            tooltip={Tooltip.Add}
          />
        </Toolbar>
      </header>
      <Collapse open={!isCollapsed}>
        {!pinnedSearches.length && <i>No searches pinned yet</i>}
        {pinnedSearches.map((item) => <PinnedSearchItem key={item.id} {...item} />)}
      </Collapse>
      {/* <ContextMenu open={contextState.open} x={contextState.x} y={contextState.y} onClose={hide}>
        <Menu>{contextState.menu}</Menu>
      </ContextMenu> */}
    </div>
  );
});

export default PinnedSearchPanel;