import groq from "groq";

import { MODULE_ACCORDION } from "../modules/accordion";
import { MARK_DEFS } from "./markDefs";

// We check the _type for backwards compatibility with the old block type names.
export const PORTABLE_TEXT = groq`
  ...,
  (_type == 'blockAccordion' || _type == 'module.accordion') => {
    '_type': 'module.accordion',
    ${MODULE_ACCORDION},
  },
  (_type == 'block') => {
    '_type': 'block',
    style,
    children[]{
      _type,
      text,
      marks
    },
    markDefs[]{
      ${MARK_DEFS}
    }
  },
  (_type == 'blockLiveStory' || _type == 'module.livestory') => {
    '_type': 'module.livestory',
    _type == "blockLiveStory" => {
      "refId": reference->_id,
      "refType": reference->_type,
      "title": reference->title,
      "id": reference->id,
      "type": reference->type
    },
    _type == "module.livestory" => {
      title,
      id,
      type,
      "tipo": "portableText"
    }
  },
  markDefs[] {
    ${MARK_DEFS}
  }
`;
