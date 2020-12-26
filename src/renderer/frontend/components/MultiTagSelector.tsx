import React, { useContext, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { ClientTag, ROOT_TAG_ID } from '../../entities/Tag';
import StoreContext from '../contexts/StoreContext';
import { IconButton, IconSet, Listbox, Option, Tag } from 'components';
import { Flyout } from 'components/Dialog';
import { action } from 'mobx';
import { MenuDivider } from 'components/Menu';

interface IExtraOption {
  label: string;
  action: () => void;
  icon?: JSX.Element;
  iconIcon?: JSX.Element;
}

interface IMultiTagSelector {
  selection: ClientTag[];
  onSelect: (item: ClientTag) => void;
  onDeselect: (item: ClientTag) => void;
  onClear: () => void;
  onCreate?: (name: string) => Promise<ClientTag>;
  tagLabel?: (item: ClientTag) => string;
  disabled?: boolean;
  extraOptions?: (query: string) => IExtraOption[] | IExtraOption[];
}

const MultiTagSelector = observer(
  ({
    selection,
    onSelect,
    onDeselect,
    onClear,
    onCreate,
    tagLabel = action((t: ClientTag) => t.name),
    disabled,
    extraOptions,
  }: IMultiTagSelector) => {
    const { tagStore } = useContext(StoreContext);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const normalizedQuery = query.toLowerCase();
    const suggestions = tagStore.tagList.filter(
      (t) => t.id !== ROOT_TAG_ID && t.name.toLowerCase().indexOf(normalizedQuery) >= 0,
    );
    const extraOptionElems = useMemo(() => {
      if (!extraOptions) return [];
      return (typeof extraOptions === 'function' ? extraOptions(query) : extraOptions).map((o, i) => (
        <Option key={`elem-${i}`} value={o.label} onClick={o.action} icon={o.icon} rightIcon={o.iconIcon} />
      ));
    }, [extraOptions, query]);

    return (
      <div
        role="combobox"
        className="input"
        onBlur={(e) => {
          if (
            e.relatedTarget instanceof HTMLElement &&
            e.relatedTarget.matches('[role="option"]')
          ) {
            return;
          }
          setIsOpen(false);
        }}
      >
        <Flyout
          open={isOpen}
          placement="bottom-start"
          target={
            <div className="multiautocomplete-input">
              <div className="input-wrapper">
                {selection.map((t) => (
                  <Tag
                    key={t.id}
                    text={tagLabel(t)}
                    color={t.viewColor}
                    onRemove={() => onDeselect(t)}
                  />
                ))}
                <input
                  disabled={disabled}
                  type="text"
                  value={query}
                  aria-autocomplete="list"
                  onChange={(e) => {
                    setIsOpen(true);
                    setQuery(e.target.value);
                  }}
                />
              </div>
              <IconButton icon={IconSet.CLOSE} text="Close" onClick={onClear} />
            </div>
          }
        >
          <Listbox>
            {suggestions.map((t) => (
              <Option
                key={t.id}
                selected={selection.includes(t)}
                value={t.name}
                onClick={() => {
                  onSelect(t);
                  setQuery('');
                  setIsOpen(false);
                }}
              />
            ))}
            {onCreate && suggestions.length === 0 ? (
              <Option
                key="create"
                selected={false}
                value={`Create Tag ${query}`}
                onClick={async () => {
                  onSelect(await onCreate(query));
                  setQuery('');
                  setIsOpen(false);
                }}
              />
            ) : null}
            {/* Show extra options, e.g. for the tag search bar: open advanced search */}
            {!!extraOptionElems.length && <>
              <MenuDivider />
              {extraOptionElems}
            </>}
          </Listbox>
        </Flyout>
      </div>
    );
  },
);

export { MultiTagSelector };
