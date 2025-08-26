import { ShapeComponent } from "../types";

import { Rect } from "./core/Rect";
import { Text } from "./core/Text";
import { Image } from "./core/Image";
import { Table } from "./core/Table";
import { Ellipse } from "./core/Ellipse";
import { Question } from "./custom/Question";
import { Interview } from "./custom/Interview";
import { FeatureIdea } from "./custom/FeatureIdea";
import { QuestionAnswer } from "./custom/QuestionAnswer";

// Registry maps type to corresponding component
export const shapeRegistry: Record<string, ShapeComponent> = {
  rect: Rect,
  text: Text,
  image: Image,
  table: Table,
  ellipse: Ellipse,
  question: Question,
  interview: Interview,
  feature_idea: FeatureIdea,
  question_answer: QuestionAnswer,
};
