# this is just for static type checkers, so I can reference the class within the class
from __future__ import annotations
from typing import Any

# this allows someone to mass reproduce a list or tuple of strings/integers/dicts/etc in a grid-like format in a dict/hash-map like format
class HashGrid:
    def __init__(
            self, 
            rows: int, 
            columns: int, 
            values: 
                list[list[Any]] | list[tuple[Any, ...]] |
                tuple[tuple[Any, ...], ...] | tuple[list[Any]] |
                None = None
        ) -> None:
        # NOTE: the rows and columns cannot be changed after initialization
        # will make it more flexible if the case requires it later
        self._row_count = rows
        self._column_count = columns

        self._hash_map: dict[str, Any] = {}
        # initialize an empty hash map if no initial values are provided 
        # the keys of the values are "row, column" so "11" means first row, first column
        if (values is None):
            self._hash_map = {f"{i+1}{j+1}": None for i in range(rows) for j in range(columns)}
        # or else set the values
        else:
            self.set(values)

    # getter properties, makes all of the properties readonly
    @property
    def row_count(self) -> int:
        return self._row_count

    @property
    def column_count(self) -> int:
        return self._column_count

    @property
    def hash_map(self) -> dict[str, Any]:
        return self._hash_map

    # set a specific cell to the given value
    def set_cell(self, row: int, column: int, value: Any) -> None: 
        # always check if the row and count matches, if not throw an error
        if (row < 0 or row > self.row_count or column < 0 or column > self.column_count):
            raise ValueError("Cannot set a cell with the given row and/or column")

        # check if the value is a hashgrid
        if (isinstance(value, HashGrid)):
            # if so, set the value to the hash map
            self._hash_map[f"{row}{column}"] = value.hash_map
        else:
            # else just set it to the value
            self._hash_map[f"{row}{column}"] = value

    # sets the entire grid by the given array of values
    def set(
            self, 
            values: 
                list[list[Any]] | 
                list[tuple[Any, ...]] |
                tuple[tuple[Any, ...], ...] | 
                tuple[list[Any]]
        ) -> None:   
        """
            Values param should be set in a format like this *(example here is a 3x3 grid)*:
            ```
                [
                    # column 1 | column 2 | column 3 
                    [    a,         b,         c    ], # row 1
                    [    d,         e,         f    ], # row 2
                    [    g,         h,         i    ]  # row 3
                ]
            ```
        """
        # make sure the row count matches
        if (len(values) != self._row_count):
            raise ValueError("Cannot set the grid, invalid number rows or columns")

        # iterate thru the values structure and assign each grid and column accordingly
        for row in range(len(values)):
            # check if the columns in this row array match the column count
            if (len(values[row]) > self.column_count):
                raise ValueError("Cannot set the grid, invalid number rows or columns")
            # iterate through the columns
            for column in range(len(values[row])):
                cell_obj: Any = values[row][column]
                # like set_cell(), check whether the value is a hash grid
                if (isinstance(cell_obj, HashGrid)):
                    # if so, set the hash map as the value
                    self._hash_map[f"{row + 1}{column + 1}"] = cell_obj.hash_map
                else:
                    # else, just set the value as is
                    self._hash_map[f"{row + 1}{column + 1}"] = cell_obj


