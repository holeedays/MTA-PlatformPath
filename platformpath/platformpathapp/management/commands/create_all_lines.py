from django.core.management import BaseCommand
from ...models import Line

from typing import Any

class Command(BaseCommand):
    help= "Initialize all MTA subway lines (existing and nonexisting)"

    def __init__(self) -> None:
        super().__init__()

        self.blue_lines: list[str] = ["A", "C", "E"]
        self.orange_lines: list[str] = ["B", "D", "F", "M"]
        self.yellow_lines: list[str] = ["N", "Q", "R", "W"]
        self.lime_green_lines: list[str] = ["G"]
        self.light_green_lines: list[str] = ["L"]
        self.gray_lines: list[str] = ["S"]
        self.brown_lines: list[str] = ["J", "Z"]
        self.red_lines: list[str] = ["1", "2", "3"]
        self.green_lines: list[str] = ["4", "5", "6"]
        self.purple_lines: list[str] = ["7"]

    def handle(self, *args: Any, **kwargs: Any) -> None:
        self.stdout.write("Creating or reinitializing all subway lines in the db..."
                          "\n--------------------------------------------------------")
        self.init_blue_lines()
        self.init_orange_lines()
        self.init_yellow_lines()
        self.init_lime_green_lines()
        self.init_light_green_lines()
        self.init_gray_lines()
        self.init_brown_lines()
        self.init_red_lines()
        self.init_green_lines()
        self.init_purple_lines()
        self.stdout.write("--------------------------------------------------------\n"
                          "We've finished initializing all subway lines in the db!")

    def init_blue_lines(self):
        for line in self.blue_lines:
            self.init_line(name=line,color="BLUE")
        self.stdout.write("--> Blue lines have finished initializing")
    
    def init_orange_lines(self):
        for line in self.orange_lines:
            self.init_line(name=line,color="ORANGE")
        self.stdout.write("--> Orange lines have finished initializing")

    def init_yellow_lines(self):
        for line in self.yellow_lines:
            self.init_line(name=line,color="YELLOW")
        self.stdout.write("--> Yellow lines have finished initializing")

    def init_lime_green_lines(self):
        for line in self.lime_green_lines:
            self.init_line(name=line,color="LIME_GREEN")
        self.stdout.write("--> Lime green lines have finished initializing")
            
    def init_light_green_lines(self):
        for line in self.light_green_lines:
            self.init_line(name=line,color="GRAY")
        self.stdout.write("--> Gray lines have finished initializing")
    
    def init_gray_lines(self):
        for line in self.gray_lines:
            self.init_line(name=line,color="DARK_GRAY")
        self.stdout.write("--> Dark gray lines have finished initializing")

    def init_brown_lines(self):
        for line in self.brown_lines:
            self.init_line(name=line,color="BROWN")
        self.stdout.write("--> Brown lines have finished initializing")
    
    def init_red_lines(self):
        for line in self.red_lines:
            self.init_line(name=line,color="RED")
        self.stdout.write("--> Red lines have finished initializing")

    def init_green_lines(self):
        for line in self.green_lines:
            self.init_line(name=line,color="GREEN")
        self.stdout.write("--> Green lines have finished initializing")

    def init_purple_lines(self):
        for line in self.purple_lines:
            self.init_line(name=line,color="PURPLE")
        self.stdout.write("--> Purple lines have finished initializing")

    # static method that us to modify an existing line within the database and change its properties or create a new one 
    # if non existent
    @staticmethod
    def init_line(name: str, color: str) -> None:
        line_model, _ = Line.objects.get_or_create(name=name)
        line_model.color = color
        line_model.save()