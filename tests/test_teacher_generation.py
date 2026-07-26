from scripts.evaluate_teacher_model import PROMPTS
def test_evaluation_scope():
 assert len(PROMPTS)>=9
 assert {'Troisième','Terminale C','Terminale D'}<={x[0] for x in PROMPTS}
 assert {'Mathématiques','Physique-Chimie','SVT'}<={x[1] for x in PROMPTS}
