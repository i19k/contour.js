import re
from collections import defaultdict


class Node:
    def __init__(self, name, x, y, z):
        self.name = name
        self.point = [x, y, z]


class Element:
    def __init__(self, name, rel, nodes):
        self.name = name
        self.rel = rel
        self.nodes = nodes

    def json(self):
        return {
            "nodes": [e.name for e in self.nodes]
        }


class Mesh:
    def __init__(self, rel):
        self.rel = rel
        self.nodes = []
        self.elements = []

    def addElement(self, elm):
        if elm.rel == self.rel:
            if elm not in self.elements:
                self.elements.append(elm)

                for n in elm.nodes:
                    if n not in self.nodes:
                        self.nodes.append(n)

    def json(self):
        return {
            "nodes": [
                {
                    str(e.name): {
                        "point": e.point
                    } for e in self.nodes
                }
            ]
        }

file = open("exports/M24Tol2Node.txt", "r")
content = file.readlines()
nodes = {}
for l in content:
    vals = []
    parts = l.split(" ")
    for part in parts:
        try:
            vals.append(int(part.strip()))
        except Exception:
            try:
                vals.append(float(part.strip()))
            except Exception:
                pass

    if len(vals) == 4:
        nodes[vals[0]] = Node(vals[0], vals[1], vals[2], vals[3])


file = open("exports/M24Tol2Elm.txt", "r")
content = file.readlines()
elements = []
for l in content:
    vals = []
    parts = l.split(" ")
    for part in parts:
        try:
            vals.append(int(part.strip()))
        except Exception:
            pass

    if len(vals) >= 9:
        elements.append(Element(vals[0], vals[3], [nodes[e] for e in vals[6:len(vals)]]))

meshGroups = defaultdict(list)

for obj in elements:
    meshGroups[obj.rel].append(obj)

meshes = []

for rel in meshGroups.keys():
    mesh = Mesh(rel)

    for elm in meshGroups[rel]:
        mesh.addElement(elm)

    meshes.append(mesh)

print(meshes[0].elements[0].nodes)
