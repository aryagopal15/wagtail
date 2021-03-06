import $ from 'jquery';

// eslint-disable-next-line func-names
const StreamBlockMenu = function (opts) {
  /*
      Helper object to handle the menu of available block types.
      Options:
      childBlocks: list of block definitions (same as passed to StreamBlock)
      id: ID of the container element (the one around 'c-sf-add-panel')
      onChooseBlock: callback fired when a block type is chosen -
          the corresponding childBlock is passed as a parameter
      */
  const self = {};
  self.container = $('#' + opts.id);
  self.openCloseButton = $('#' + opts.id + '-openclose');

  if (self.container.hasClass('stream-menu-closed')) {
    self.container.hide();
  }

  // eslint-disable-next-line func-names
  self.show = function () {
    self.container.slideDown();
    self.container.removeClass('stream-menu-closed');
    self.container.attr('aria-hidden', 'false');
    self.openCloseButton.addClass('c-sf-add-button--close');
  };

  // eslint-disable-next-line func-names
  self.hide = function () {
    self.container.slideUp();
    self.container.addClass('stream-menu-closed');
    self.container.attr('aria-hidden', 'true');
    self.openCloseButton.removeClass('c-sf-add-button--close');
  };

  // eslint-disable-next-line func-names
  self.addFirstBlock = function () {
    if (opts.onChooseBlock) opts.onChooseBlock(opts.childBlocks[0]);
  };

  // eslint-disable-next-line func-names
  self.toggle = function () {
    if (self.container.hasClass('stream-menu-closed')) {
      if (opts.childBlocks.length === 1) {
        /* If there's only one block type, add it automatically */
        self.addFirstBlock();
      } else {
        self.show();
      }
    } else {
      self.hide();
    }
  };

  /* set up show/hide on click behaviour */
  self.openCloseButton.on('click', (e) => {
    e.preventDefault();
    self.toggle();
  });

  /* set up button behaviour */
  $.each(opts.childBlocks, (i, childBlock) => {
    const button = self.container.find('.action-add-block-' + childBlock.name);
    button.on('click', () => {
      if (opts.onChooseBlock) opts.onChooseBlock(childBlock);
      self.hide();
    });
  });

  return self;
};

// eslint-disable-next-line func-names
window.StreamBlock = function (opts) {
  /* Fetch the HTML template strings to be used when adding a new block of each type.
      Also reorganise the opts.childBlocks list into a lookup by name
      */
  const listMemberTemplates = {};
  const childBlocksByName = {};
  for (let i = 0; i < opts.childBlocks.length; i++) {
    const childBlock = opts.childBlocks[i];
    childBlocksByName[childBlock.name] = childBlock;
    const template = $('#' + opts.definitionPrefix + '-newmember-' + childBlock.name).text();
    listMemberTemplates[childBlock.name] = template;
  }

  // eslint-disable-next-line func-names
  return function (elementPrefix) {
    // eslint-disable-next-line no-undef, new-cap
    const sequence = Sequence({
      prefix: elementPrefix,
      maxNumChildBlocks: opts.maxNumChildBlocks,
      onInitializeMember(sequenceMember) {
        /* initialize child block's JS behaviour */
        const blockTypeName = $('#' + sequenceMember.prefix + '-type').val();
        const blockOpts = childBlocksByName[blockTypeName];
        if (blockOpts.initializer) {
          /* the child block's own elements have the prefix '{list member prefix}-value' */
          blockOpts.initializer(sequenceMember.prefix + '-value');
        }

        /* initialize delete button */
        $('#' + sequenceMember.prefix + '-delete').on('click', () => {
          sequenceMember.delete();
        });

        /* initialise move up/down buttons */
        $('#' + sequenceMember.prefix + '-moveup').on('click', () => {
          sequenceMember.moveUp();
        });

        $('#' + sequenceMember.prefix + '-movedown').on('click', () => {
          sequenceMember.moveDown();
        });

        /* Set up the 'append a block' menu that appears after the block */
        // eslint-disable-next-line new-cap
        StreamBlockMenu({
          childBlocks: opts.childBlocks,
          id: sequenceMember.prefix + '-appendmenu',
          onChooseBlock(childBlock) {
            const template = listMemberTemplates[childBlock.name];
            sequenceMember.appendMember(template);
          }
        });
      },

      onEnableMoveUp(sequenceMember) {
        $('#' + sequenceMember.prefix + '-moveup').removeClass('disabled');
      },

      onDisableMoveUp(sequenceMember) {
        $('#' + sequenceMember.prefix + '-moveup').addClass('disabled');
      },

      onEnableMoveDown(sequenceMember) {
        $('#' + sequenceMember.prefix + '-movedown').removeClass('disabled');
      },

      onDisableMoveDown(sequenceMember) {
        $('#' + sequenceMember.prefix + '-movedown').addClass('disabled');
      },

      onDisableAdd(members) {
        for (let i = 0; i < members.length; i++) {
          $('#' + members[i].prefix + '-appendmenu-openclose')
            .removeClass('c-sf-add-button--visible').delay(300)
            .slideUp();
        }
        $('#' + elementPrefix + '-prependmenu-openclose')
          .removeClass('c-sf-add-button--visible').delay(300)
          .slideUp();
      },

      onEnableAdd(members) {
        for (let i = 0; i < members.length; i++) {
          $('#' + members[i].prefix + '-appendmenu-openclose')
            .addClass('c-sf-add-button--visible').delay(300)
            .slideDown();
        }
        $('#' + elementPrefix + '-prependmenu-openclose')
          .addClass('c-sf-add-button--visible').delay(300)
          .slideDown();
      }
    });

    /* Set up the 'prepend a block' menu that appears above the first block in the sequence */
    // eslint-disable-next-line new-cap
    StreamBlockMenu({
      childBlocks: opts.childBlocks,
      id: elementPrefix + '-prependmenu',
      onChooseBlock(childBlock) {
        const template = listMemberTemplates[childBlock.name];
        sequence.insertMemberAtStart(template);
      }
    });
  };
};
