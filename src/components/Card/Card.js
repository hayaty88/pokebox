import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Types from "./Types";

const Card = React.forwardRef(({ pokemon, index }, ref) => {
  const { t, i18n } = useTranslation();
  const meterHeight = pokemon.height / 10;
  const kgWeight = pokemon.weight / 10;

  const [localisedName, setLocalisedName] = useState("");
  useEffect(() => {
    const fetchPokemonSpecies = async () => {
      try {
        const response = await fetch(pokemon.species.url);
        const pokemonSpecies = await response.json();
        console.log("pokemonSpecies");
        console.log(pokemonSpecies);
        const nameEntry = pokemonSpecies.names.find(
          (entry) => entry.language.name === i18n.language
        );
        if (nameEntry) {
          setLocalisedName(nameEntry.name);
          console.log("nameEntry.name:" + nameEntry.name);
        }
      } catch (error) {
        console.log("Failed to fetch pokemon species:", error);
      }
    };
    fetchPokemonSpecies();
  }, [pokemon.species.url, i18n.language]);

  return (
    <div
      className="card mx-3 sm:mx-2 p-8 bg-blue-50 border rounded-lg shadow-lg"
      key={index}
      ref={ref}
    >
      <div className="cardImg">
        <img
          src={pokemon.sprites.front_default}
          alt={localisedName}
          className="mx-auto"
        />
      </div>
      <h3 className="cardName mb-3 text-2xl font-bold capitalize">
        {localisedName}
      </h3>
      <div className="cardTypes flex justify-center">
        <p className="font-bold">No: {pokemon.id}</p>
      </div>
      <div className="cardTypes flex justify-center">
        <p className="font-bold">{t("type")}:</p>
        <Types types={pokemon.types} />
      </div>
      <div className="cardInfo">
        <div className="cardData">
          <p className="font-bold">
            {t("height")}: {meterHeight}m
          </p>
        </div>
        <div className="cardData">
          <p className="font-bold">
            {t("weight")}: {kgWeight}kg
          </p>
        </div>
        <div className="cardData">
          <p className="font-bold capitalize">
            {t("ability")}: {pokemon.abilities[0].ability.name}
          </p>
        </div>
      </div>
    </div>
  );
});

export default Card;
