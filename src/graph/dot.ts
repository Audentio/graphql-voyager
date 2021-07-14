import { stringifyWrappers } from '../introspection/';
import * as _ from 'lodash';

export function getDot(typeGraph, displayOptions): string {
  function isNode(type) {
    return typeGraph.nodes[type.id] !== undefined;
  }

  return (
    typeGraph &&
    `
    digraph {
      graph [
        rankdir = "LR"
      ];
      node [
        fontsize = "16"
        fontname = "helvetica, open-sans"
        shape = "plaintext"
      ];
      edge [
      ];
      ranksep = 2.0
      ${objectValues(
        typeGraph.nodes,
        (node) => `
        "${node.name}" [
          id = "${node.id}"
          label = ${nodeLabel(node, displayOptions.verboseOutput)}
        ]
        ${objectValues(node.fields, (field) =>
          isNode(field.type)
            ? `
          "${node.name}":"${field.name}" -> "${field.type.name}" [
            id = "${field.id} => ${field.type.id}"
            label = "${node.name}:${field.name}"
          ]
        `
            : '',
        )};
        ${array(
          node.possibleTypes,
          ({ id, type }) => `
          "${node.name}":"${type.name}" -> "${type.name}" [
            id = "${id} => ${type.id}"
            style = "dashed"
          ]
        `,
        )}
        ${array(
          node.derivedTypes,
          ({ id, type }) => `
          "${node.name}":"${type.name}" -> "${type.name}" [
            id = "${id} => ${type.id}"
            style = "dotted"
          ]
        `,
        )}
      `,
      )}
    }
  `
  );

  function nodeLabel(node, showDescription = false) {
    if (node.name === 'Player') {
      console.log(node);
    }

    const htmlID = HtmlId('TYPE_TITLE::' + node.name);
    const kindLabel =
      node.kind !== 'OBJECT'
        ? '&lt;&lt;' + node.kind.toLowerCase() + '&gt;&gt;'
        : '';

    return `
      <<TABLE ALIGN="LEFT" BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5">
        <TR>
          <TD CELLPADDING="4" ${htmlID}><FONT POINT-SIZE="18">${
      node.name
    }</FONT><BR/>${kindLabel}</TD>
        </TR>
        ${objectValues(node.fields, (field) =>
          nodeField(showDescription, field),
        )}
        ${possibleTypes(node)}
        ${derivedTypes(node)}
      </TABLE>>
    `;
  }

  function canDisplayRow(type) {
    if (type.kind === 'SCALAR' || type.kind === 'ENUM') {
      return displayOptions.showLeafFields;
    }
    return true;
  }

  function nodeField(showDescription, field) {
    const relayIcon = field.relayType ? TEXT('{R}') : '';
    const deprecatedIcon = field.isDeprecated ? TEXT('{D}') : '';
    const parts = stringifyWrappers(field.typeWrappers).map(TEXT);

    let descriptionText = '';

    if (!!field.description && field.description.length && showDescription) {
      let maxLen = 60;

      let description = field.description
        .split('<')
        .join('')
        .split('>')
        .join('');

      const size = Math.ceil(description.length / maxLen);

      for (let i = 0; i < size; i++) {
        const startIndex = i * maxLen;

        descriptionText += `<TR><TD COLSPAN="2" ALIGN="center">___${description.substr(
          startIndex,
          maxLen,
        )}</TD></TR>`;
      }
    }

    return canDisplayRow(field.type)
      ? `
      <TR>
        <TD ${HtmlId(field.id)} ALIGN="LEFT" PORT="${field.name}">
          <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
            <TR>
              <TD ALIGN="LEFT">${field.name}<FONT>  </FONT></TD>
              <TD ALIGN="RIGHT">${deprecatedIcon}${relayIcon}${parts[0]}${
          field.type.name
        }${parts[1]}</TD>
            </TR>
            ${descriptionText}
          </TABLE>
        </TD>
      </TR>
    `
      : '';
  }
}

function possibleTypes(node) {
  const possibleTypes = node.possibleTypes;
  if (_.isEmpty(possibleTypes)) {
    if (node.kind === 'ENUM' && !_.isEmpty(node.enumValues)) {
      return `
        <TR>
          <TD>enum values</TD>
        </TR>
        ${array(
          node.enumValues,
          ({ name, description }) => `
          <TR>
            <TD ${HtmlId(name)} ALIGN="LEFT" PORT="${name}">
              <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
                <TR>
                  <TD ALIGN="LEFT">${name}<FONT>  </FONT></TD>
                  ${
                    !!description ? `<TD ALIGN="RIGHT">${description}</TD>` : ''
                  }
                </TR>
              </TABLE>
            </TD>
          </TR>
        `,
        )}
      `;
    }
    return '';
  }
  return `
    <TR>
      <TD>possible types</TD>
    </TR>
    ${array(
      possibleTypes,
      ({ id, type }) => `
      <TR>
        <TD ${HtmlId(id)} ALIGN="LEFT" PORT="${type.name}">${type.name}</TD>
      </TR>
    `,
    )}
  `;
}

function derivedTypes(node) {
  const derivedTypes = node.derivedTypes;
  if (_.isEmpty(derivedTypes)) {
    return '';
  }
  return `
    <TR>
      <TD>implementations</TD>
    </TR>
    ${array(
      derivedTypes,
      ({ id, type }) => `
      <TR>
        <TD ${HtmlId(id)} ALIGN="LEFT" PORT="${type.name}">${type.name}</TD>
      </TR>
    `,
    )}
  `;
}

function objectValues<X>(
  object: { [key: string]: X },
  stringify: (X) => string,
): string {
  return _.values(object).map(stringify).join('\n');
}

function array<X>(array: [X], stringify: (X) => string): string {
  return array ? array.map(stringify).join('\n') : '';
}

function HtmlId(id) {
  return 'HREF="remove_me_url" ID="' + id + '"';
}

function TEXT(str) {
  if (str === '') return '';
  str = str.replace(/]/, '&#93;');
  return '<FONT>' + str + '</FONT>';
}
