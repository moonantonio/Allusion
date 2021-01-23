import { observer } from 'mobx-react-lite';
import React, { useContext, useState, useCallback, useMemo } from 'react';
import { Collapse } from 'src/frontend/components/Collapse';
import StoreContext from 'src/frontend/contexts/StoreContext';
import useContextMenu from 'src/frontend/hooks/useContextMenu';
import UiStore, { FileSearchCriteria } from 'src/frontend/stores/UiStore';
import { emptyFunction } from 'src/frontend/utils';

import { Listbox, Option } from 'widgets';
import { IconSet } from 'widgets/icons';
import { ContextMenu, Menu, MenuItem, Toolbar, ToolbarButton } from 'widgets/menus';
import Tree, { ITreeItem } from 'widgets/Tree';

const enum Tooltip {
  Add = 'Pin current search',
}

interface IContextMenuProps {
  search: IPinnedSearch;
  onAdd: () => void;
  onReplace: (search: IPinnedSearch) => void;
  onModify: (search: IPinnedSearch) => void;
  onDelete: (search: IPinnedSearch) => void;
  uiStore: UiStore;
}

const PinnedSearchTreeContextMenu = observer(({ search, onDelete, onAdd, onReplace, onModify }: IContextMenuProps) => {
  const addCurrentSearch = useCallback(() => onAdd(), [onAdd]);
  const handleReplace = useCallback(() => search && onReplace(search), [search, onReplace]);
  const handleModify = useCallback(() => search && onModify(search), [search, onModify]);
  const openDeleteDialog = useCallback(() => search && onDelete(search), [search, onDelete]);

  return (
    <>
      <MenuItem text="Add current search" onClick={addCurrentSearch} icon={IconSet.SEARCH_EXTENDED} />
      <MenuItem text="Replace with current search" onClick={handleReplace} icon={IconSet.REPLACE} />
      <MenuItem text="Edit..." onClick={handleModify} icon={IconSet.EDIT} />
      <MenuItem text="Delete" onClick={openDeleteDialog} icon={IconSet.DELETE} />
    </>
  );
});

interface IPinnedSearch {
  id: string;
  name: string;
  criteria: FileSearchCriteria[];
  isSearched: boolean; // TODO: compute it
}

interface ITreeData {
  showContextMenu: (x: number, y: number, menu: JSX.Element) => void;
  // expansion: IExpansionState;
  // setExpansion: React.Dispatch<IExpansionState>;
  add: () => void;
  delete: (search: IPinnedSearch) => void;
  replace: (search: IPinnedSearch) => void;
  modify: (search: IPinnedSearch) => void;
}

const PinnedSearchLabel = (nodeData: any, treeData: any) => (
  <PinnedSearchItem nodeData={nodeData} treeData={treeData} />
);

const PinnedSearchItem = observer(
  ({ nodeData, treeData }: { nodeData: IPinnedSearch; treeData: ITreeData }) => {
    const { uiStore } = useContext(StoreContext);
    const { showContextMenu, delete: onDelete, add, modify, replace } = treeData;

    const handleContextMenu = useCallback(
      (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        showContextMenu(
          event.clientX,
          event.clientY,
          <PinnedSearchTreeContextMenu
            search={nodeData}
            onDelete={onDelete}
            onAdd={add}
            onModify={modify}
            onReplace={replace}
            uiStore={uiStore}
          />,
        );
      },
      [showContextMenu, nodeData, onDelete, add, modify, replace, uiStore],
    );

    return (
      // {/* TODO: edit + trash buttonon hover */}
      // todo: tree item, with queries as sub-items?
      <div
        className="tree-content-label"
        onContextMenu={handleContextMenu}
      >
        {IconSet.SEARCH}
        <div onClick={() => uiStore.replaceSearchCriterias(nodeData.criteria)}>{nodeData.name}</div>
      </div>
    )
  });

interface IPinnedSearchTreeTreeProps {
  showContextMenu: (x: number, y: number, menu: JSX.Element) => void;
  onAdd: () => void;
  onDelete: (search: IPinnedSearch) => void;
  onReplace: (search: IPinnedSearch) => void;
  onModify: (search: IPinnedSearch) => void;
  items: IPinnedSearch[];
}
const mapSearch = (
  search: IPinnedSearch,
): ITreeItem => ({
  id: search.id,
  label: PinnedSearchLabel,
  children: [],
  nodeData: search,
  isExpanded: () => false,
  isSelected: () => false,
  className: search.isSearched ? 'searched' : undefined,
});

const PinnedSearchTree = observer(({ onDelete, showContextMenu, items, onAdd, onReplace, onModify }: IPinnedSearchTreeTreeProps) => {
  // const { locationStore, uiStore } = useContext(StoreContext);
  // const [expansion, setExpansion] = useState<IExpansionState>({});
  const treeData = useMemo(
    (): ITreeData => ({
      // expansion,
      // setExpansion,
      add: onAdd,
      delete: onDelete,
      replace: onReplace,
      modify: onModify,

      showContextMenu,

    }),
    [onDelete, showContextMenu],
  );
  // const handleBranchKeyDown = useCallback(
  //   (
  //     event: React.KeyboardEvent<HTMLLIElement>,
  //     nodeData: ClientLocation | IDirectoryTreeItem,
  //     treeData: ITreeData,
  //   ) =>
  //     createBranchOnKeyDown(
  //       event,
  //       nodeData,
  //       treeData,
  //       isExpanded,
  //       emptyFunction,
  //       toggleExpansion,
  //       customKeys.bind(null, (path: string) => uiStore.replaceSearchCriteria(criteria(path))),
  //     ),
  //   [uiStore],
  // );
  //   return () => {
  //     isMounted = false;
  //     dispose();
  //   };
  // }, [locationStore.locationList]);

  return (
    <Tree
      id="location-list"
      multiSelect
      children={items.map(mapSearch)}
      treeData={treeData}
      toggleExpansion={emptyFunction}
      onBranchKeyDown={emptyFunction}
      onLeafKeyDown={emptyFunction}
    />
  );
});

const PinnedSearchPanel = observer(() => {
  const { uiStore } = useContext(StoreContext);
  const [contextState, { show, hide }] = useContextMenu();

  const [pinnedSearches, setPinnedSearches] = useState<IPinnedSearch[]>([]);

  const [isCollapsed, setCollapsed] = useState(true);

  const handlePin = useCallback(() => {
    // window.alert('TODO: Pin' + uiStore.searchCriteriaList);
    setPinnedSearches(current => [...current, {
      id: Math.random().toString(),
      // name: 'New pinned search',
      name: uiStore.searchCriteriaList.map(v => v.toString()).join(', '),
      criteria: uiStore.searchCriteriaList.toJSON(),
      isSearched: false,
    }]);
  }, [uiStore.searchCriteriaList]);

  const handleReplace = useCallback((s: IPinnedSearch) => {
    const newPinnedSearch: IPinnedSearch = {
      id: s.id,
      name: uiStore.searchCriteriaList.map(v => v.toString()).join(', '),
      criteria: uiStore.searchCriteriaList.toJSON(),
      isSearched: false,
    };
    const newPinnedSearches = [...pinnedSearches];
    newPinnedSearches[pinnedSearches.indexOf(s)] = newPinnedSearch;
    setPinnedSearches(newPinnedSearches);
  }, [pinnedSearches, uiStore.searchCriteriaList]);

  const handleModify = useCallback((s: IPinnedSearch) => {
    uiStore.replaceSearchCriterias(s.criteria);
    uiStore.toggleAdvancedSearch();
    // TODO: No easy way to save after modifying yet
  }, [uiStore]);

  // TODO: Re-use advanced search panel for modifying pinned searches

  // TODO: Would be nice to have those vscode style resizable collapses
  return (
    <div className="section">
      <header>
        <h2 onClick={() => setCollapsed(!isCollapsed)}>Pinned searches</h2>
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
        {/* <Listbox>
          {pinnedSearches.map((item) => <PinnedSearchItem key={item.id} {...item} />)}
        </Listbox> */}
        <PinnedSearchTree
          showContextMenu={show}
          onDelete={(s) => setPinnedSearches(prev => prev.filter(x => x.id !== s.id))}
          onAdd={handlePin}
          onReplace={handleReplace}
          onModify={handleModify}
          items={pinnedSearches}
        />
      </Collapse>
      <ContextMenu isOpen={contextState.open} x={contextState.x} y={contextState.y} close={hide}>
        <Menu>{contextState.menu}</Menu>
      </ContextMenu>
    </div>
  );
});

export default PinnedSearchPanel;